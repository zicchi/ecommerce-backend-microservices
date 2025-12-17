import { PrismaClient } from '@prisma/client';
import { getRedisClient, AppError, logger } from '@ecommerce/shared';
import axios from 'axios';

const prisma = new PrismaClient();

class OrderService {
    async createOrder(userId, items) {
        if (!items || items.length === 0) {
            throw new AppError('No items in order', 400);
        }

        let totalAmount = 0;
        const orderItemsData = [];

        // Validate Products & Calculate Total
        for (const item of items) {
            try {
                const productRes = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/${item.productId}`);
                const product = productRes.data.data.product;

                if (product.stock_quantity < item.quantity) {
                    throw new AppError(`Insufficient stock for product ${product.name}`, 400);
                }

                totalAmount += parseFloat(product.price) * item.quantity;
                orderItemsData.push({
                    product_id: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                });
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    throw new AppError(`Product ${item.productId} not found`, 404);
                }
                throw error;
            }
        }

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

    async getOrder(orderId, userId) {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: { items: true },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.user_id !== userId) {
            throw new AppError('Not authorized to view this order', 403);
        }

        return order;
    }

    async getMyOrders(userId) {
        return await prisma.order.findMany({
            where: { user_id: userId },
            include: { items: true },
            orderBy: { created_at: 'desc' },
        });
    }

    async cancelOrder(orderId, userId) {
        const order = await prisma.order.findUnique({ where: { id: parseInt(orderId) } });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.user_id !== userId) {
            throw new AppError('Not authorized', 403);
        }

        if (order.status === 'cancelled') {
            throw new AppError('Order already cancelled', 400);
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status: 'cancelled' },
            include: { items: true },
        });

        const eventData = {
            orderId: updatedOrder.id,
            items: updatedOrder.items.map(i => ({ productId: i.product_id, quantity: i.quantity })),
        };
        const publisher = await getRedisClient('publisher');
        await publisher.publish('order-cancelled', JSON.stringify(eventData));

        return updatedOrder;
    }

    // Used by subscriber
    async confirmOrder(orderId) {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'confirmed' },
        });
        logger.info(`Order ${orderId} confirmed`);
    }
}

export default new OrderService();
