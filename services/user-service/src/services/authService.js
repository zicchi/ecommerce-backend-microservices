import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken, AppError } from '@ecommerce/shared';

const prisma = new PrismaClient();

class AuthService {
    async register(name, email, password) {
        if (!email || !password) {
            throw new AppError('Please provide email and password', 400);
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                email,
                password_hash: passwordHash,
                name,
            },
        });

        const token = signToken(newUser.id, process.env.JWT_SECRET, '1d', { role: newUser.role });

        return { user: newUser, token };
    }

    async login(email, password) {
        if (!email || !password) {
            throw new AppError('Please provide email and password', 400);
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new AppError('Incorrect email or password', 401);
        }

        const token = signToken(user.id, process.env.JWT_SECRET, '1d', { role: user.role });

        return { token };
    }
}

export default new AuthService();
