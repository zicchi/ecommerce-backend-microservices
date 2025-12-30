import { AppError } from '@ecommerce/shared';
import orderService from '../services/orderService.js';



export const createOrder = async (req, res, next) => {
    try {
        const { items } = req.body;
        const userId = req.user.id;

        const newOrder = await orderService.createOrder(userId, items);

        res.status(201).json({
            status: 'success',
            data: { order: newOrder },
        });


    } catch (err) {
        next(err);
    }
};

export const getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrder(id, req.user.id);

        res.status(200).json({
            status: 'success',
            data: { order },
        });


    } catch (err) {
        next(err);
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getMyOrders(req.user.id);

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders },
        });


    } catch (err) {
        next(err);
    }
};

export const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedOrder = await orderService.cancelOrder(id, req.user.id);

        res.status(200).json({
            status: 'success',
            data: { order: updatedOrder },
        });


    } catch (err) {
        next(err);
    }
};
