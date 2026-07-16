# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if any native node modules require them
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (dev + production)
RUN npm ci

# Copy codebase
COPY . .

# Compile TypeScript / Medusa assets
RUN npm run build

# ==========================================
# Stage 2: Runtime Production Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets and configurations from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/medusa-config.js ./medusa-config.js
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["./entrypoint.sh"]
