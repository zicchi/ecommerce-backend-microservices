import { PrismaClient } from '@prisma/client';
import { getRedisClient, AppError, logger } from '@ecommerce/shared';
import axios from 'axios';

const prisma = new PrismaClient();

class OptimizedOrderService {
    async createOrder(userId, items) {
        if (!items || items.length === 0) {
            throw new AppError('No items in order', 400);
        }

        let totalAmount = 0;
        const orderItemsData = [];

        // Validate Products & Calculate Total (Parallelized - OPTIMIZED)
        const productPromises = items.map(async (item) => {
            try {
                const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/${item.productId}`);
                const product = productRes.data.data.product;

                if (product.stock_quantity < item.quantity) {
                    throw new AppError(`Insufficient stock for product ${product.name}`, 400);
                }

                return {
                    product_id: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                    total: parseFloat(product.price) * item.quantity
                };
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    throw new AppError(`Product ${item.productId} not found`, 404);
                }
                throw error;
            }
        });

        const results = await Promise.all(productPromises);

        results.forEach(res => {
            totalAmount += res.total;
            orderItemsData.push({
                product_id: res.product_id,
                quantity: res.quantity,
                price: res.price
            });
        });

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

        // Publish Event
        const eventData = {
            orderId: newOrder.id,
            items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        };
        const publisher = await getRedisClient('publisher');
        await publisher.publish('order-created', JSON.stringify(eventData));

        return newOrder;
    }
}

export default new OptimizedOrderService();
