import express from 'express';
import * as orderController from '../controllers/orderController.js';
import * as legacyOrderController from '../controllers/legacyOrderController.js';

import { verifyToken, AppError } from '@ecommerce/shared';

const router = express.Router();

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in', 401));
        }

        console.log('DEBUG: Verifying token with secret:', process.env.JWT_SECRET.substring(0, 5) + '...');
        const decoded = await verifyToken(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        next(new AppError('Invalid token', 401));
    }
};

router.use(protect);

router.get('/metrics', (req, res) => {
    res.json(process.cpuUsage());
});

router.post('/', orderController.createOrder);
router.post('/legacy', legacyOrderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id/cancel', orderController.cancelOrder);

export default router;
