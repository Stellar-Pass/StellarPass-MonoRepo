# Stellar Pass

**NFT event ticketing and proof-of-attendance on Stellar — the first ticketing protocol purpose-built for Stellar's native capabilities.**

---

## Architecture

Stellar Pass is a multi-repo project with four main components:

| Component | Directory | Tech Stack | Port |
|---|---|---|---|
| **Frontend** | `stellar-pass-frontend/` | Next.js 14, TypeScript, Tailwind CSS | 3000 |
| **Backend API** | `stellar-pass-backend/` | Fastify, TypeScript, PostgreSQL, Redis | 3001 |
| **Smart Contracts** | `stellar-pass-contracts/` | Rust, Soroban | — |
| **Indexer** | `stellar-pass-indexer/` | TypeScript, Stellar Horizon | 3002 |
| **Shared Types** | `stellar-pass-shared/` | TypeScript, Zod | — |

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  Organizer Dashboard · Attendee Web App · Widget · Scanner       │
├─────────────────────────────────────────────────────────────────┤
│                          API LAYER                               │
│  Fastify Backend (3001) — Events, Tickets, Auth, Check-in, POAP │
├─────────────────────────────────────────────────────────────────┤
│                   SMART CONTRACT LAYER (Soroban)                 │
│  Ticket NFT · POAP Badge · Resale Escrow                        │
├─────────────────────────────────────────────────────────────────┤
│                        INDEXER LAYER                             │
│  Horizon Watcher (3002) — Payments, Ownership, Attendance        │
├─────────────────────────────────────────────────────────────────┤
│                       STELLAR NETWORK                            │
│  Freeze/Clawback · Claimable Balances · DEX · USDC · Muxed Accts│
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Rust + Cargo (for smart contracts)
- Stellar CLI (`stellar`) and Soroban CLI (`soroban`) — for contract deployment

### 1. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 2. Backend

```bash
cd stellar-pass-backend
cp .env.example .env
npm install
npm run dev
# API running at http://localhost:3001
```

### 3. Indexer

```bash
cd stellar-pass-indexer
cp .env.example .env
npm install
npm run dev
# Indexer running at http://localhost:3002
```

### 4. Frontend

```bash
cd stellar-pass-frontend
cp .env.example .env.local
npm install
npm run dev
# App running at http://localhost:3000
```

### 5. Smart Contracts (Soroban)

```bash
cd stellar-pass-contracts
cargo build --target wasm32-unknown-unknown --release
# Deploy via scripts/deploy.sh
```

### Or use Docker Compose for everything:

```bash
docker-compose up
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/challenge` | SEP-10 challenge |
| POST | `/api/v1/auth/token` | JWT issuance |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/events` | Create event |
| GET | `/api/v1/events` | List events |
| GET | `/api/v1/events/:id` | Event detail |
| POST | `/api/v1/tickets/purchase` | Purchase ticket |
| GET | `/api/v1/tickets/:id` | Ticket detail |
| GET | `/api/v1/tickets/my` | My tickets |
| POST | `/api/v1/check-in/verify` | QR check-in |
| GET | `/api/v1/poaps/my` | My POAPs |
| GET | `/api/v1/analytics/:event_id` | Event analytics |
| POST | `/api/v1/webhooks` | Create webhook |

---

## Stellar Features Used

| Feature | Purpose |
|---|---|
| **Soroban NFTs (SEP-0048)** | Ticket and POAP badge minting |
| **Asset Freeze / Clawback** | Revoke stolen/scalped tickets (Stellar-unique) |
| **Claimable Balances** | Airdrop tickets to users without wallets |
| **Built-in DEX** | Secondary market ticket resale |
| **Muxed Accounts** | Purchase session management |
| **USDC Settlement** | Instant organizer payouts (~5 seconds) |
| **SEP-10 Auth** | Wallet-based authentication (no passwords) |
| **SEP-24** | Fiat on-ramp for ticket purchases |

---

## Project Structure

```
GrantFox/
├── docker-compose.yml
├── README.md
├── .gitignore
│
├── stellar-pass-shared/          # Shared TypeScript types
│   └── src/
│       ├── types/index.ts        # All TypeScript interfaces
│       ├── constants/index.ts    # Network config, asset codes
│       └── validation/index.ts   # Zod schemas
│
├── stellar-pass-backend/         # Fastify API server
│   ├── src/
│   │   ├── server.ts             # Entry point
│   │   ├── routes/               # API route handlers
│   │   ├── services/             # Business logic
│   │   ├── db/                   # PostgreSQL schema + queries
│   │   ├── stellar/              # Stellar SDK integration
│   │   ├── middleware/           # Auth, rate limiting
│   │   └── utils/                # QR, crypto, slug helpers
│   └── docker/
│
├── stellar-pass-contracts/       # Soroban smart contracts
│   ├── contracts/
│   │   ├── ticket/               # Ticket NFT (SEP-0048)
│   │   ├── poap/                 # POAP Badge (soulbound)
│   │   └── escrow/               # Resale Escrow
│   └── scripts/                  # Deploy + invoke scripts
│
├── stellar-pass-indexer/         # Horizon stream processor
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── streams/              # Payment + contract event processors
│   │   ├── dispatchers/          # Event routing + webhook delivery
│   │   ├── db/                   # Database writes
│   │   └── stellar/              # Horizon + Soroban RPC clients
│   └── docker/
│
└── stellar-pass-frontend/        # Next.js 14 app
    ├── app/
    │   ├── (dashboard)/          # Organizer dashboard
    │   ├── (public)/             # Attendee pages
    │   └── (scanner)/            # Check-in PWA
    ├── components/               # Reusable UI components
    ├── lib/                      # Stellar SDK, API client, wallets
    ├── hooks/                    # React hooks
    └── public/                   # PWA manifest, icons
```

---

## Success Metrics (6 months post-launch)

| Metric | Target |
|---|---|
| Events created | 200+ |
| Tickets minted | 10,000+ |
| POAPs claimed | 5,000+ |
| Active organizers | 50+ |
| Secondary market trades | 500+ |
| New wallets onboarded | 3,000+ |

---

## License

MIT
