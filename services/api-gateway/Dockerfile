FROM node:20-alpine

# Install OpenSSL for compatibility
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
# API Gateway doesn't use Shared, but we copy it if we change later.
# Strictly copying only what's needed for Gateway:
COPY services/api-gateway ./services/api-gateway

WORKDIR /app/services/api-gateway

CMD ["npm", "start"]
