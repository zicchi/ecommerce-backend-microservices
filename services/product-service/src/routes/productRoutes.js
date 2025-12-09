import express from 'express';
import * as productController from '../controllers/productController.js';
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

        const decoded = await verifyToken(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        next(new AppError('Invalid token', 401));
    }
};

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

router.use(protect);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
