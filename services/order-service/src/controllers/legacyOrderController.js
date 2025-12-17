import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import axios from 'axios';
import { AppError, logger } from '@ecommerce/shared';

const prisma = new PrismaClient();
const redisPublisher = createClient({ url: process.env.REDIS_URL });
const redisSubscriber = createClient({ url: process.env.REDIS_URL });

redisPublisher.on('error', (err) => logger.error('Redis Publisher Error', err));
redisSubscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));

Promise.all([redisPublisher.connect(), redisSubscriber.connect()]).catch(console.error);

// Subscribe to events (Example: Inventory Confirmed) - KEPT FOR COMPLETENESS OF LEGACY STATE
redisSubscriber.subscribe('inventory-confirmed', async (message) => {
    try {
        const { orderId } = JSON.parse(message);
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'confirmed' },
        });
        logger.info(`Order ${orderId} confirmed`);
    } catch (err) {
        logger.error('Error processing inventory confirmation', err);
    }
});

export const createOrder = async (req, res, next) => {
    try {
        const { items } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return next(new AppError('No items in order', 400));
        }

        // 1. Validate Products & Calculate Total (Synchronous call to Product Service)
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            try {
                const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/${item.productId}`);
                const product = productRes.data.data.product;

                if (product.stock_quantity < item.quantity) {
                    return next(new AppError(`Insufficient stock for product ${product.name}`, 400));
                }

                totalAmount += parseFloat(product.price) * item.quantity;
                orderItemsData.push({
                    product_id: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                });
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    return next(new AppError(`Product ${item.productId} not found`, 404));
                }
                throw error;
            }
        }

        // 2. Create Order (Pending)
        const newOrder = await prisma.order.create({
            data: {
                user_id: userId,
                total_amount: totalAmount,
                status: 'pending',
                items: {
                    create: orderItemsData,
                },
            },
            include: { items: true },
        });

        // 3. Publish Event untuk Pengurangan Inventaris
        const eventData = {
            orderId: newOrder.id,
            items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        };
        await redisPublisher.publish('order-created', JSON.stringify(eventData));

        res.status(201).json({
            status: 'success',
            data: { order: newOrder },
        });
    } catch (err) {
        next(err);
    }
};
