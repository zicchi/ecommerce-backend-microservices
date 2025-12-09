import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken, AppError } from '@ecommerce/shared';

const prisma = new PrismaClient();

export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return next(new AppError('Email already in use', 400));
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                email,
                password_hash: passwordHash,
                name,
            },
        });

        const token = signToken(newUser.id, process.env.JWT_SECRET);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                },
            },
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        const token = signToken(user.id, process.env.JWT_SECRET);

        res.status(200).json({
            status: 'success',
            token,
        });
    } catch (err) {
        next(err);
    }
};
