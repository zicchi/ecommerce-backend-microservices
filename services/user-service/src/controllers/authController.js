import authService from '../services/authService.js';

export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        const { user, token } = await authService.register(name, email, password);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
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
        const { token } = await authService.login(email, password);

        res.status(200).json({
            status: 'success',
            token,
        });
    } catch (err) {
        next(err);
    }
};
