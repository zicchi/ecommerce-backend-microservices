FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json ./

# Copy all package.json files to install dependencies correctly (Workspace support)
COPY packages/shared/package.json ./packages/shared/
COPY services/user-service/package.json ./services/user-service/
COPY services/product-service/package.json ./services/product-service/
COPY services/order-service/package.json ./services/order-service/
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies from root
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY services/user-service ./services/user-service

# Generate Prisma Client (User Service)
WORKDIR /app/services/user-service
RUN npx prisma generate

# Back to service directory
WORKDIR /app/services/user-service

CMD ["npm", "start"]
