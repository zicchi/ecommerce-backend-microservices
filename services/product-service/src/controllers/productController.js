import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { AppError, logger } from '@ecommerce/shared';

const prisma = new PrismaClient();
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

const redisSubscriber = redisClient.duplicate();
redisSubscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));

Promise.all([redisClient.connect(), redisSubscriber.connect()]).catch(console.error);

// Subscribe to Order Created Event
redisSubscriber.subscribe('order-created', async (message) => {
    try {
        const { orderId, items } = JSON.parse(message);
        logger.info(`Processing order ${orderId} inventory deduction`);

        // Kurangi stok
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock_quantity: { decrement: item.quantity } },
            });
        }

        // Invalidate cache
        await invalidateProductCache();

        // Publish confirmation back to Order Service
        await redisClient.publish('inventory-confirmed', JSON.stringify({ orderId }));
        logger.info(`Inventory confirmed for order ${orderId}`);

    } catch (err) {
        logger.error('Error processing order inventory', err);
    }
});

// Subscribe to Order Cancelled Event
redisSubscriber.subscribe('order-cancelled', async (message) => {
    try {
        const { orderId, items } = JSON.parse(message);
        logger.info(`Processing order ${orderId} cancellation and stock restoration`);

        // Kembalikan stok
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock_quantity: { increment: item.quantity } },
            });
        }

        // Invalidate cache
        await invalidateProductCache();
        logger.info(`Stock restored for order ${orderId}`);

    } catch (err) {
        logger.error('Error processing order cancellation', err);
    }
});


const CACHE_EXPIRATION = 3600; // 1 hour

const invalidateProductCache = async () => {
    const keys = await redisClient.keys('products:*');
    if (keys.length > 0) {
        await redisClient.del(keys);
    }
};

export const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `products:${page}:${limit}`;
        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            return res.status(200).json(JSON.parse(cachedProducts));
        }

        const products = await prisma.product.findMany({
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        });

        const total = await prisma.product.count();

        const response = {
            status: 'success',
            results: products.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: { products },
        };

        await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(response));

        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
};

export const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cacheKey = `products:${id}`;
        const cachedProduct = await redisClient.get(cacheKey);

        if (cachedProduct) {
            return res.status(200).json(JSON.parse(cachedProduct));
        }

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });

        if (!product) {
            return next(new AppError('Product not found', 404));
        }

        const response = {
            status: 'success',
            data: { product },
        };

        await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(response));

        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
};

export const createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock_quantity } = req.body;

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price,
                stock_quantity,
            },
        });

        await invalidateProductCache();

        res.status(201).json({
            status: 'success',
            data: { product: newProduct },
        });
    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock_quantity } = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                price,
                stock_quantity,
            },
        });

        await invalidateProductCache();
        await redisClient.del(`products:${id}`);

        res.status(200).json({
            status: 'success',
            data: { product: updatedProduct },
        });
    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id: parseInt(id) },
        });

        await invalidateProductCache();
        await redisClient.del(`products:${id}`);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        next(err);
    }
};
