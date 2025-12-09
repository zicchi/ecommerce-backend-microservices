const request = require('supertest');
const express = require('express');
const authController = require('../src/controllers/authController');
const { AppError } = require('../../../packages/shared');

// Mock Prisma
const prismaMock = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
};

// Mock Dependencies
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn(),
}));

jest.mock('../../../packages/shared', () => ({
    signToken: jest.fn(() => 'mockToken'),
    AppError: class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    },
}));

const app = express();
app.use(express.json());
app.post('/register', authController.register);
app.post('/login', authController.login);

// Error Handler for Test App
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ message: err.message });
});

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /register', () => {
        it('should register a new user', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: 'customer',
            });

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

            expect(res.statusCode).toBe(201);
            expect(res.body.token).toBe('mockToken');
        });

        it('should return 400 if email already exists', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

            const res = await request(app)
                .post('/register')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Email already in use');
        });
    });
});
