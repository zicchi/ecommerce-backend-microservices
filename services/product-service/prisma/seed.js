import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const products = [
    {
        name: 'Smartphone X Pro',
        description: 'Latest flagship smartphone with 5G connectivity and AI camera.',
        price: 12000000,
        stock_quantity: 50,
    },
    {
        name: 'Laptop UltraSlim 15',
        description: 'Lightweight laptop for professionals with 16GB RAM and 512GB SSD.',
        price: 18500000,
        stock_quantity: 30,
    },
    {
        name: 'Wireless Earbuds Active',
        description: 'Noise cancelling wireless earbuds with 24h battery life.',
        price: 1500000,
        stock_quantity: 100,
    },
    {
        name: 'Smart Watch Series 5',
        description: 'Fitness tracker and smartwatch with heart rate monitor.',
        price: 3500000,
        stock_quantity: 75,
    },
    {
        name: '4K Gaming Monitor 27"',
        description: '144Hz refresh rate IPS panel for immersive gaming.',
        price: 5500000,
        stock_quantity: 20,
    },
    {
        name: 'Mechanical Keyboard RGB',
        description: 'Blue switches mechanical keyboard with customizable RGB lighting.',
        price: 850000,
        stock_quantity: 150,
    },
    {
        name: 'Gaming Mouse items',
        description: 'High precision optical sensor gaming mouse.',
        price: 450000,
        stock_quantity: 200,
    },
    {
        name: 'USB-C Hub Multiport',
        description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader.',
        price: 350000,
        stock_quantity: 300,
    },
    {
        name: 'Portable SSD 1TB',
        description: 'Fast external storage with USB 3.2 Gen 2 interface.',
        price: 1800000,
        stock_quantity: 60,
    },
    {
        name: 'Bluetooth Speaker Mini',
        description: 'Portable waterproof speaker with deep bass.',
        price: 450000,
        stock_quantity: 120,
    },
    {
        name: 'Running Shoes Zoom',
        description: 'Lightweight running shoes for marathon training.',
        price: 1200000,
        stock_quantity: 40,
    },
    {
        name: 'Cotton T-Shirt Basic',
        description: '100% organic cotton t-shirt in various colors.',
        price: 99000,
        stock_quantity: 500,
    },
    {
        name: 'Denim Jeans Slim Fit',
        description: 'Classic blue denim jeans with durable stitching.',
        price: 450000,
        stock_quantity: 100,
    },
    {
        name: 'Backpack Commuter',
        description: 'Water-resistant backpack with laptop compartment.',
        price: 650000,
        stock_quantity: 80,
    },
    {
        name: 'Coffee Maker Drip',
        description: 'Automatic drip coffee maker with programmable timer.',
        price: 750000,
        stock_quantity: 25,
    },
    {
        name: 'Air Purifier HEPA',
        description: 'Removes 99.9% of allergens and dust for rooms up to 40sqm.',
        price: 2100000,
        stock_quantity: 15,
    },
    {
        name: 'Yoga Mat Anti-Slip',
        description: 'Eco-friendly TPE yoga mat with alignment lines.',
        price: 250000,
        stock_quantity: 90,
    },
    {
        name: 'Dumbbell Set 10kg',
        description: 'Adjustable dumbbell set for home workout.',
        price: 850000,
        stock_quantity: 35,
    },
    {
        name: 'Desk Lamp LED',
        description: 'Dimmable LED desk lamp with eye-care technology.',
        price: 250000,
        stock_quantity: 110,
    },
    {
        name: 'Ergonomic Office Chair',
        description: 'Mesh back office chair with lumber support.',
        price: 1800000,
        stock_quantity: 10,
    },
];

async function main() {
    console.log('Start seeding ...');

    try {
        await redisClient.connect();
        const keys = await redisClient.keys('products:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log('Cleared Redis product cache.');
        }
    } catch (e) {
        console.warn('Failed to clear cache (Redis might be down):', e.message);
    }

    // Optional: Clear existing data
    await prisma.product.deleteMany();
    console.log('Deleted existing products.');

    for (const p of products) {
        const product = await prisma.product.create({
            data: p,
        });
        console.log(`Created product with id: ${product.id}`);
    }
    console.log('Seeding finished.');

    try {
        await redisClient.disconnect();
    } catch (e) {
        // ignore
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
