import { getRedisClient, logger } from '@ecommerce/shared';
import orderService from '../services/orderService.js';

export const initInventorySubscriber = async () => {
    const subscriber = await getRedisClient('subscriber');

    await subscriber.subscribe('inventory-confirmed', async (message) => {
        try {
            const { orderId } = JSON.parse(message);
            await orderService.confirmOrder(orderId);
        } catch (err) {
            logger.error('Error processing inventory confirmation', err);
        }
    });

    logger.info('Inventory Subscriber initialized');
};
