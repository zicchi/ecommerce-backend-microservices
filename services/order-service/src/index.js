import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { logger } from '@ecommerce/shared';
import orderRoutes from './routes/orderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/orders', orderRoutes);

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

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    logger.info(`Order Service running on port ${PORT}`);
});
