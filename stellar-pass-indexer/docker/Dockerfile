# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runtime

# Security: run as non-root
RUN addgroup -S indexer && adduser -S indexer -G indexer

WORKDIR /app

# Copy built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy .env.example as documentation
COPY .env.example ./.env.example

# Environment defaults
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV HEALTH_PORT=3002

EXPOSE 3002

USER indexer

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
