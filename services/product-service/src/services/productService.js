import { PrismaClient } from '@prisma/client';
import { getRedisClient, AppError, logger } from '@ecommerce/shared';

const prisma = new PrismaClient();
const CACHE_EXPIRATION = 3600; // 1 hour

class ProductService {
    async getRedis() {
        return await getRedisClient('publisher'); // Use publisher client for get/set/del as it is read/write
    }

    async invalidateProductCache() {
        const redis = await this.getRedis();
        const keys = await redis.keys('products:*');
        if (keys.length > 0) {
            await redis.del(keys);
        }
    }

    async getAllProducts(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const cacheKey = `products:${page}:${limit}`;
        const redis = await this.getRedis();

        const cachedProducts = await redis.get(cacheKey);
        if (cachedProducts) {
            return JSON.parse(cachedProducts);
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

        await redis.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(response));
        return response;
    }

    async getProduct(id) {
        const cacheKey = `products:${id}`;
        const redis = await this.getRedis();

        const cachedProduct = await redis.get(cacheKey);
        if (cachedProduct) {
            return JSON.parse(cachedProduct);
        }

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const response = {
            status: 'success',
            data: { product },
        };

        await redis.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(response));
        return response;
    }

    async createProduct(data) {
        const newProduct = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock_quantity: data.stock_quantity,
            },
        });

        await this.invalidateProductCache();
        return newProduct;
    }

    async updateProduct(id, data) {
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock_quantity: data.stock_quantity,
            },
        });

        await this.invalidateProductCache();
        const redis = await this.getRedis();
        await redis.del(`products:${id}`);

        return updatedProduct;
    }

    async deleteProduct(id) {
        await prisma.product.delete({
            where: { id: parseInt(id) },
        });

        await this.invalidateProductCache();
        const redis = await this.getRedis();
        await redis.del(`products:${id}`);
    }

    // Used by subscribers
    async updateStock(id, quantity, operation) {
        const data = operation === 'decrement'
            ? { stock_quantity: { decrement: quantity } }
            : { stock_quantity: { increment: quantity } };

        await prisma.product.update({
            where: { id: id },
            data: data
        });
    }
}

export default new ProductService();
