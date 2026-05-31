import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  database: {
    url: requireEnv('DATABASE_URL'),
  },
  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },
  stellar: {
    network: optionalEnv('STELLAR_NETWORK', 'testnet') as 'testnet' | 'public',
    horizonUrl: optionalEnv('HORIZON_URL', 'https://horizon-testnet.stellar.org'),
    sorobanRpcUrl: optionalEnv('SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org'),
  },
  indexer: {
    pollIntervalMs: parseInt(optionalEnv('POLL_INTERVAL_MS', '5000'), 10),
  },
  log: {
    level: optionalEnv('LOG_LEVEL', 'info'),
  },
  health: {
    port: parseInt(optionalEnv('HEALTH_PORT', '3002'), 10),
  },
} as const;
