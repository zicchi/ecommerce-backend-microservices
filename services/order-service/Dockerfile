FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json ./

# Copy all package.json files
COPY packages/shared/package.json ./packages/shared/
COPY services/user-service/package.json ./services/user-service/
COPY services/product-service/package.json ./services/product-service/
COPY services/order-service/package.json ./services/order-service/
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies from root
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY services/order-service ./services/order-service

# Generate Prisma Client
WORKDIR /app/services/order-service
RUN npx prisma generate

CMD ["npm", "start"]
