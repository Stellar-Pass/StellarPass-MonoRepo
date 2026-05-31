import { Pool, PoolConfig } from 'pg';
import { config } from '../utils/config';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('db-pool');

const poolConfig: PoolConfig = {
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  log.fatal({ err }, 'Unexpected database pool error');
  process.exit(1);
});

pool.on('connect', () => {
  log.debug('New database connection established');
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  } catch (err) {
    log.error({ err }, 'Database connection check failed');
    return false;
  }
}

export async function closePool(): Promise<void> {
  log.info('Closing database pool');
  await pool.end();
}
