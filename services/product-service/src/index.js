import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { logger } from '@ecommerce/shared';
import productRoutes from './routes/productRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/products', productRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    logger.error(err.message);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});

import { initOrderSubscriber } from './subscribers/orderSubscriber.js';

const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
    logger.info(`Product Service running on port ${PORT}`);
    await initOrderSubscriber();
});
