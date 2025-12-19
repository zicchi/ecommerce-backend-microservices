import { createClient } from 'redis';
import { logger } from './index.js';

let publisher;
let subscriber;

const getRedisUrl = () => {
    const url = process.env.REDIS_URL;
    logger.info(`Attempting Redis connection to: ${url || 'DEFAULT (localhost)'}`);
    return url || 'redis://localhost:6379';
};

export const getRedisClient = async (type = 'publisher') => {
    if (type === 'subscriber') {
        if (!subscriber) {
            subscriber = createClient({ url: getRedisUrl() });
            subscriber.on('error', (err) => logger.error('Redis Private Subscriber Error', err));
            await subscriber.connect();
        }
        return subscriber;
    }

    if (!publisher) {
        publisher = createClient({ url: getRedisUrl() });
        publisher.on('error', (err) => logger.error('Redis Publisher Error', err));
        await publisher.connect();
    }
    return publisher;
};

export const closeRedisClients = async () => {
    if (publisher) {
        await publisher.disconnect();
        publisher = null;
    }
    if (subscriber) {
        await subscriber.disconnect();
        subscriber = null;
    }
};
