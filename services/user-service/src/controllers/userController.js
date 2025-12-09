import { PrismaClient } from '@prisma/client';
import { AppError } from '@ecommerce/shared';

const prisma = new PrismaClient();

export const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    created_at: user.created_at,
                },
            },
        });
    } catch (err) {
        next(err);
    }
};
