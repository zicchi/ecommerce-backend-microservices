import userService from '../services/userService.js';

export const getMe = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.user.id);

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
