import optimizedOrderService from '../services/optimizedOrderService.js';

export const createOrder = async (req, res, next) => {
    try {
        const newOrder = await optimizedOrderService.createOrder(req.user.id, req.body.items);

        res.status(201).json({
            status: 'success',
            data: {
                order: newOrder,
            },
        });
    } catch (err) {
        next(err);
    }
};
