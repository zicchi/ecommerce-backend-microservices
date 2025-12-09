import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { logger } from '@ecommerce/shared';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

const dotenvResult = dotenv.config({ path: envPath });
console.log('Dotenv Result:', dotenvResult);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`User Service running on port ${PORT}`);
});
