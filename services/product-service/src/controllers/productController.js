import { AppError } from '@ecommerce/shared';
import productService from '../services/productService.js';



export const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const response = await productService.getAllProducts(page, limit);

        res.status(200).json(response);


    } catch (err) {
        next(err);
    }
};

export const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const response = await productService.getProduct(id);

        res.status(200).json(response);


    } catch (err) {
        next(err);
    }
};

export const createProduct = async (req, res, next) => {
    try {
        const newProduct = await productService.createProduct(req.body);

        res.status(201).json({
            status: 'success',
            data: { product: newProduct },
        });


    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedProduct = await productService.updateProduct(id, req.body);

        res.status(200).json({
            status: 'success',
            data: { product: updatedProduct },
        });


    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        await productService.deleteProduct(id);

        res.status(204).json({
            status: 'success',
            data: null,
        });


    } catch (err) {
        next(err);
    }
};
