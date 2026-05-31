import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { testConnection, shutdown as shutdownPool } from './db/pool';
import { connectRedis, shutdownRedis } from './db/redis';
import { registerErrorHandler } from './middleware/error-handler';

// Route plugins
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import ticketRoutes from './routes/tickets';
import checkInRoutes from './routes/checkin';
import poapRoutes from './routes/poaps';
import webhookRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';
import organizerRoutes from './routes/organizer';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // -- Plugins --

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-me',
    sign: { expiresIn: '24h' },
  });

  // -- Error handling --
  registerErrorHandler(fastify);

  // -- Health check --
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  fastify.get('/ready', async (_request, reply) => {
    try {
      const dbOk = await testConnection();
      if (!dbOk) {
        return reply.status(503).send({ status: 'not_ready', db: false });
      }
      return reply.status(200).send({ status: 'ready', db: true });
    } catch {
      return reply.status(503).send({ status: 'not_ready', db: false });
    }
  });

  // -- Routes --
  await fastify.register(authRoutes);
  await fastify.register(eventRoutes);
  await fastify.register(ticketRoutes);
  await fastify.register(checkInRoutes);
  await fastify.register(poapRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(analyticsRoutes);
  await fastify.register(organizerRoutes);

  return fastify;
}

async function start(): Promise<void> {
  // Connect to Redis
  try {
    await connectRedis();
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis connection failed, continuing without cache:', err);
  }

  // Test PostgreSQL
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('PostgreSQL connection failed');
    process.exit(1);
  }
  console.log('PostgreSQL connected');

  const server = await buildServer();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await server.close();
      await shutdownPool();
      await shutdownRedis();
      console.log('Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`Stellar Pass API listening on ${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
