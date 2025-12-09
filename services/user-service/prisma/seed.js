import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password_hash: passwordHash,
            role: 'admin',
        },
    });

    const user = await prisma.user.upsert({
        where: { email: 'user@cc.cc' },
        update: {},
        create: {
            email: 'user@cc.cc',
            name: 'User',
            password_hash: passwordHash,
            role: 'customer',
        },
    });

    console.log(`Created (or found) admin user with id: ${admin.id} and user with id: ${user.id}`);
    console.log('Seeding finished.');
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
