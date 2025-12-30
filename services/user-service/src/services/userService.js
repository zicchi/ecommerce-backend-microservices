import { PrismaClient } from '@prisma/client';
import { AppError } from '@ecommerce/shared';

const prisma = new PrismaClient();

class UserService {
    async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }
}

export default new UserService();
