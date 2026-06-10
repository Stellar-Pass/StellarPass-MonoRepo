# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

LABEL org.opencontainers.image.title="Stellar Pass Backend"
LABEL org.opencontainers.image.description="Stellar Pass API server"
LABEL org.opencontainers.image.source="https://github.com/Stellar-Pass/StellarPass-MonoRepo"

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S stellarpass -u 1001

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

COPY docker/ ./docker/
COPY src/db/schema.sql ./docker/schema.sql

RUN chown -R stellarpass:nodejs /app

USER stellarpass

ENV NODE_ENV=production

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
