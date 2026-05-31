# Stellar Pass Indexer

Real-time Stellar ledger indexer for the Stellar Pass ticketing platform. Watches the Stellar blockchain via Horizon API and Soroban RPC, indexing payment events, NFT transfers, and POAP mints into PostgreSQL.

## Architecture

```
Horizon API  ──→  Payment Stream Processor  ──→  Event Dispatcher  ──→  PostgreSQL
Soroban RPC  ──→  Contract Event Processor  ──→  Event Dispatcher  ──→  Webhooks
                                                                  ──→  Redis
```

The indexer has two main stream processors:

- **Payment Stream Processor**: Watches muxed accounts (M-addresses) for incoming payments. When a payment matches a purchase session, it confirms the session and triggers webhooks.
- **Contract Event Processor**: Polls Soroban contract events (transfer, freeze, clawback, mint) to track ticket ownership changes and POAP mints.

Both processors publish events to Redis pub/sub channels, which the **Event Dispatcher** consumes to update the database and deliver webhooks.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Stellar testnet account (for contract interactions)

## Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database, Redis, and Stellar configuration

# Build
npm run build

# Run
npm start
```

## Development

```bash
# Run in development mode with ts-node
npm run dev

# Watch mode (requires ts-node-dev)
npx ts-node-dev src/index.ts
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `STELLAR_NETWORK` | `testnet` | `testnet` or `public` |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` | Horizon server URL |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC URL |
| `POLL_INTERVAL_MS` | `5000` | Contract event polling interval (ms) |
| `LOG_LEVEL` | `info` | Log level (trace/debug/info/warn/error/fatal) |
| `HEALTH_PORT` | `3002` | Health check HTTP server port |

## Health Check

The indexer exposes a health check endpoint:

```
GET http://localhost:3002/health
```

Returns `200` when both PostgreSQL and Redis are reachable, `503` otherwise.

## Docker

```bash
# Build
docker build -f docker/Dockerfile -t stellar-pass-indexer .

# Run
docker run --env-file .env -p 3002:3002 stellar-pass-indexer
```

## Crash Recovery

The indexer persists cursors in Redis:

- **Payment streams**: Each muxed account's last processed paging token is stored in `indexer:cursor:payment:{muxed}`. On restart, streams resume from the last cursor.
- **Contract events**: Each contract's last processed ledger number is stored in `indexer:ledger:contract:{contractId}`. On restart, polling resumes from the next ledger.

This ensures no events are missed across restarts.

## Rate Limiting

Horizon API requests are automatically rate-limited (1 request/second minimum spacing). If a 429 response is received, the client backs off for 5 seconds before retrying.

## Event Flow

1. **Payment detected** on a muxed account
2. Payment Stream Processor validates amount and asset
3. Publishes `payment.confirmed` to Redis
4. Event Dispatcher receives the event
5. Updates purchase session status to `confirmed`
6. Sends `ticket.purchased` webhook to organizer
7. (Separately) Contract Event Processor observes the NFT mint
8. Publishes `nft.transferred` to Redis
9. Event Dispatcher updates ticket ownership in DB
