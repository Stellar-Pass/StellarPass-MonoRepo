import Redis from 'ioredis';
import { config } from '../utils/config';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('redis');

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 10) {
      log.fatal('Redis connection failed after 10 retries');
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    log.warn({ attempt: times, delayMs: delay }, 'Redis reconnecting');
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  log.info('Redis connected');
});

redis.on('error', (err) => {
  log.error({ err }, 'Redis error');
});

redis.on('close', () => {
  log.warn('Redis connection closed');
});

export const redisSub = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redisSub.on('error', (err) => {
  log.error({ err }, 'Redis subscriber error');
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (err) {
    log.error({ err }, 'Redis connection check failed');
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  log.info('Closing Redis connections');
  await redis.quit();
  await redisSub.quit();
}

// --- Cursor persistence helpers ---

const CURSOR_PREFIX = 'indexer:cursor:';
const LEDGER_PREFIX = 'indexer:ledger:';

export async function getCursor(key: string): Promise<string | null> {
  return redis.get(`${CURSOR_PREFIX}${key}`);
}

export async function setCursor(key: string, cursor: string): Promise<void> {
  await redis.set(`${CURSOR_PREFIX}${key}`, cursor);
}

export async function getLastProcessedLedger(key: string): Promise<number> {
  const val = await redis.get(`${LEDGER_PREFIX}${key}`);
  return val ? parseInt(val, 10) : 0;
}

export async function setLastProcessedLedger(key: string, ledger: number): Promise<void> {
  await redis.set(`${LEDGER_PREFIX}${key}`, ledger.toString());
}

// --- Internal event pub/sub channel names ---

export const CHANNELS = {
  PAYMENT_CONFIRMED: 'indexer:event:payment.confirmed',
  NFT_TRANSFERRED: 'indexer:event:nft.transferred',
  NFT_FROZEN: 'indexer:event:nft.frozen',
  NFT_CLAWED_BACK: 'indexer:event:nft.clawed_back',
  POAP_MINTED: 'indexer:event:poap.minted',
} as const;
