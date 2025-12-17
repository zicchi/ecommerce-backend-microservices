import { getRedisClient, logger } from '@ecommerce/shared';
import productService from '../services/productService.js';

export const initOrderSubscriber = async () => {
    const subscriber = await getRedisClient('subscriber');
    const publisher = await getRedisClient('publisher');

    // Subscribe to Order Created Event
    subscriber.subscribe('order-created', async (message) => {
        try {
            const { orderId, items } = JSON.parse(message);
            logger.info(`Processing order ${orderId} inventory deduction`);

            // Kurangi stok
            for (const item of items) {
                await productService.updateStock(item.productId, item.quantity, 'decrement');
            }

            // Invalidate cache
            await productService.invalidateProductCache();

            // Publish confirmation back to Order Service
            await publisher.publish('inventory-confirmed', JSON.stringify({ orderId }));
            logger.info(`Inventory confirmed for order ${orderId}`);

        } catch (err) {
            logger.error('Error processing order inventory', err);
        }
    });

    // Subscribe to Order Cancelled Event
    subscriber.subscribe('order-cancelled', async (message) => {
        try {
            const { orderId, items } = JSON.parse(message);
            logger.info(`Processing order ${orderId} cancellation and stock restoration`);

            // Kembalikan stok
            for (const item of items) {
                await productService.updateStock(item.productId, item.quantity, 'increment');
            }

            // Invalidate cache
            await productService.invalidateProductCache();
            logger.info(`Stock restored for order ${orderId}`);

        } catch (err) {
            logger.error('Error processing order cancellation', err);
        }
    });

    logger.info('Order Subscriber initialized');
};
