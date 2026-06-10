import http from 'http';
import cron from 'node-cron';
import { config } from './utils/config';
import { createChildLogger } from './utils/logger';
import { pool, checkDatabaseConnection, closePool } from './db/pool';
import { redis, redisSub, checkRedisConnection, closeRedis } from './db/redis';
import { startEventDispatcher, stopEventDispatcher } from './dispatchers/event.dispatcher';
import {
  startPaymentStreamProcessor,
  refreshStreams,
  stopPaymentStreams,
  expireStaleSessions,
} from './streams/payment.stream';
import {
  watchContract,
  startContractEventProcessor,
  stopContractEventProcessor,
} from './streams/contract.stream';

const log = createChildLogger('main');

// Graceful shutdown state
let isShuttingDown = false;
let healthServer: http.Server | null = null;

// Metrics state
const metrics = {
  startedAt: Date.now(),
  eventsProcessed: 0,
  paymentsProcessed: 0,
  webhooksDelivered: 0,
  errors: 0,
  lastProcessedLedger: 0,
  activeStreams: 0,
};

async function main(): Promise<void> {
  log.info('=== Stellar Pass Indexer starting ===');
  log.info({ network: config.stellar.network, horizonUrl: config.stellar.horizonUrl }, 'Configuration loaded');

  // ---- 1. Verify connections ----

  log.info('Checking database connection...');
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    log.fatal('Database connection failed — exiting');
    process.exit(1);
  }
  log.info('Database connection OK');

  log.info('Checking Redis connection...');
  await redis.connect();
  await redisSub.connect();
  const redisOk = await checkRedisConnection();
  if (!redisOk) {
    log.fatal('Redis connection failed — exiting');
    process.exit(1);
  }
  log.info('Redis connection OK');

  // ---- 2. Load contracts to watch ----

  await loadContractsToWatch();

  // ---- 3. Start event dispatcher (Redis pub/sub listener) ----

  await startEventDispatcher();

  // ---- 4. Start stream processors ----

  await startPaymentStreamProcessor();
  await startContractEventProcessor();

  // ---- 5. Schedule periodic tasks ----

  // Refresh payment streams every 30 seconds to pick up new sessions
  cron.schedule('*/30 * * * * *', async () => {
    if (isShuttingDown) return;
    try {
      await refreshStreams();
    } catch (err) {
      log.error({ err }, 'Error refreshing payment streams');
    }
  });

  // Expire stale sessions every minute
  cron.schedule('0 * * * * *', async () => {
    if (isShuttingDown) return;
    try {
      await expireStaleSessions();
    } catch (err) {
      log.error({ err }, 'Error expiring stale sessions');
    }
  });

  // Health check: log stats every 5 minutes
  cron.schedule('0 */5 * * * *', () => {
    if (isShuttingDown) return;
    log.info({
      uptime: Math.floor((Date.now() - metrics.startedAt) / 1000),
      eventsProcessed: metrics.eventsProcessed,
      paymentsProcessed: metrics.paymentsProcessed,
      webhooksDelivered: metrics.webhooksDelivered,
      errors: metrics.errors,
      activeStreams: metrics.activeStreams,
    }, 'Indexer heartbeat');
  });

  // ---- 6. Start health check HTTP server ----

  startHealthServer();

  log.info('=== Stellar Pass Indexer is running ===');
}

/**
 * Load contract IDs to watch from the database.
 * Watches all ticket NFT contracts and POAP contracts from active events.
 */
async function loadContractsToWatch(): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT DISTINCT tt.nft_contract_id, 'ticket' AS type
       FROM ticket_tiers tt
       JOIN events e ON e.id = tt.event_id
       WHERE tt.nft_contract_id IS NOT NULL
         AND e.status IN ('on_sale', 'sold_out')

       UNION

       SELECT DISTINCT e.poap_contract_id, 'poap' AS type
       FROM events e
       WHERE e.poap_contract_id IS NOT NULL
         AND e.poap_enabled = true
         AND e.status IN ('on_sale', 'sold_out')`,
    );

    for (const row of result.rows) {
      const contractId = row.nft_contract_id as string;
      const type = row.type as 'ticket' | 'poap';
      watchContract(contractId, type);
    }

    log.info({ count: result.rows.length }, 'Loaded contracts to watch');
  } catch (err) {
    log.error({ err }, 'Failed to load contracts to watch');
    // Non-fatal — we'll still watch payment streams
  }
}

/**
 * Start a simple HTTP server for health checks.
 */
function startHealthServer(): void {
  healthServer = http.createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const dbOk = await checkDatabaseConnection();
      const redisOk = await checkRedisConnection();

      const status = dbOk && redisOk ? 200 : 503;
      const body = {
        status: status === 200 ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: {
          database: dbOk ? 'ok' : 'error',
          redis: redisOk ? 'ok' : 'error',
        },
      };

      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
      return;
    }

    if (req.url === '/ready' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: true }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  healthServer.listen(config.health.port, () => {
    log.info({ port: config.health.port }, 'Health check server listening');
  });
}

/**
 * Graceful shutdown handler.
 */
async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    log.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  log.info({ signal }, 'Graceful shutdown initiated');

  // Stop accepting new work
  stopPaymentStreams();
  stopContractEventProcessor();
  await stopEventDispatcher();

  // Close HTTP server
  if (healthServer) {
    healthServer.close(() => {
      log.info('Health server closed');
    });
  }

  // Close database and Redis connections
  try {
    await closePool();
  } catch (err) {
    log.error({ err }, 'Error closing database pool');
  }

  try {
    await closeRedis();
  } catch (err) {
    log.error({ err }, 'Error closing Redis connections');
  }

  log.info('=== Stellar Pass Indexer shut down gracefully ===');
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled errors
process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'Uncaught exception — initiating shutdown');
  shutdown('uncaughtException').catch(() => process.exit(1));
});

// Start the indexer
main().catch((err) => {
  log.fatal({ err }, 'Failed to start indexer');
  process.exit(1);
});
