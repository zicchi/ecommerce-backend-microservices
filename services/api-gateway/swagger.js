import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce Microservices API',
            version: '1.0.0',
            description: 'API Documentation for the E-commerce Backend (User, Product, Order Services)',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'API Gateway',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        paths: {
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register a new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                        name: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User registered successfully' },
                        400: { description: 'Bad request' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Login successful' },
                        401: { description: 'Invalid credentials' },
                    },
                },
            },
            '/users/me': {
                get: {
                    tags: ['User'],
                    summary: 'Get current user profile',
                    responses: {
                        200: { description: 'User profile retrieved' },
                        401: { description: 'Unauthorized' },
                    },
                },
            },
            '/products': {
                get: {
                    tags: ['Products'],
                    summary: 'Get list of products',
                    parameters: [
                        { in: 'query', name: 'page', schema: { type: 'integer' } },
                        { in: 'query', name: 'limit', schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'List of products' },
                    },
                },
                post: {
                    tags: ['Products'],
                    summary: 'Create a product (Admin)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        price: { type: 'number' },
                                        stock_quantity: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Product created' },
                    },
                },
            },
            '/products/{id}': {
                get: {
                    tags: ['Products'],
                    summary: 'Get product details',
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'Product details' },
                        404: { description: 'Product not found' },
                    },
                },
                put: {
                    tags: ['Products'],
                    summary: 'Update product (Admin)',
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        price: { type: 'number' },
                                        stock_quantity: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Product updated' },
                    },
                },
                delete: {
                    tags: ['Products'],
                    summary: 'Delete product (Admin)',
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        204: { description: 'Product deleted' },
                    },
                },
            },
            '/orders': {
                post: {
                    tags: ['Orders'],
                    summary: 'Create an order',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    productId: { type: 'integer' },
                                                    quantity: { type: 'integer' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Order created' },
                        400: { description: 'Insufficient stock or invalid data' },
                    },
                },
            },
            '/orders/my-orders': {
                get: {
                    tags: ['Orders'],
                    summary: 'Get my orders',
                    responses: {
                        200: { description: 'List of user orders' },
                    },
                },
            },
            '/orders/{id}': {
                get: {
                    tags: ['Orders'],
                    summary: 'Get order details',
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'Order details' },
                        404: { description: 'Order not found' },
                    },
                },
            },
            '/orders/{id}/cancel': {
                patch: {
                    tags: ['Orders'],
                    summary: 'Cancel order',
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
                    ],
                    responses: {
                        200: { description: 'Order cancelled' },
                        400: { description: 'Cannot cancel order' },
                    },
                },
            },
        },
    },
    apis: [], // We are defining paths manually above for simplicity in the Gateway
};

export default swaggerJsdoc(options);
