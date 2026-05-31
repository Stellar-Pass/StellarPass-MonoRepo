# Stellar Pass

**NFT event ticketing and proof-of-attendance on Stellar — the first ticketing protocol purpose-built for Stellar's native capabilities.**

---

## The Problem

The global event ticketing industry is worth $70B+ and plagued by:

- **Counterfeit tickets** — paper and barcode tickets are trivially duplicated
- **Scalping and fraud** — bots buy tickets in bulk, resell at 3-10x markup
- **No proof of attendance** — event organizers have no on-chain record of who actually showed up
- **High platform fees** — Ticketmaster charges 15-30% in fees
- **Fragmented secondary market** — no transparent, fair resale infrastructure
- **No attendee data ownership** — platforms own the relationship, not organizers

Blockchain ticketing solves these problems, but current solutions are on Ethereum/Polygon where:
- Transaction fees make free POAPs expensive at scale ($0.01-0.50 per mint)
- Ticket minting costs add up for high-volume events (10K+ tickets)
- No native asset freeze/clawback — revoking a stolen ticket requires complex smart contract logic
- No native conditional distribution — onboarding users without wallets is hard

**Stellar has the infrastructure to solve every one of these problems natively — but no one has built a ticketing platform on it.**

---

## The Solution

Stellar Pass is a full-stack event ticketing platform with integrated proof-of-attendance badges, built on Stellar's native primitives.

### Core Features

| Feature | Description |
|---|---|
| **NFT Ticket Minting** | Event organizers create tickets as Stellar NFTs (via Soroban SEP-0048 or native asset issuance) |
| **QR Code Check-in** | Attendees present a signed QR code at the venue; organizer scans to verify and mark attendance |
| **Proof-of-Attendance Badges (Stellar POAP)** | Non-transferable NFT badges automatically minted upon check-in — on-chain proof you were there |
| **Anti-Fraud Controls** | Native asset freeze/clawback to revoke stolen or fraudulent tickets |
| **Secondary Market** | Ticket resale on Stellar's built-in DEX with optional price caps enforced by Soroban contracts |
| **Event Organizer Dashboard** | Create events, manage ticket tiers, view sales, scan check-ins, view analytics |
| **Attendee Profile** | Wallet-based profile showing all tickets and POAP badges collected |
| **Social Sharing** | Share POAP badges to Twitter/Farcaster/X directly from the app |
| **Analytics** | Attendance rates, engagement metrics, POAP claim rates, geographic distribution |

### How It Works

```
ORGANIZER                          STELLAR PASS                         ATTENDEE
─────────                          ────────────                         ────────
   |                                     |                                   |
   |  Create event                       |                                   |
   |  Set ticket tiers + pricing         |                                   |
   |------------------------------------>|                                   |
   |                                     |  Mint ticket NFTs on Stellar      |
   |                                     |  (Soroban or native asset)        |
   |                                     |                                   |
   |  Share event link                   |                                   |
   |------------------------------------>|                                   |
   |                                     |  Attendee browses event page      |
   |                                     |<──────────────────────────────────|
   |                                     |                                   |
   |                                     |  Purchase ticket (USDC/XLM)       |
   |                                     |<──────────────────────────────────|
   |                                     |                                   |
   |                                     |  Ticket NFT transferred to        |
   |                                     |  attendee's Stellar wallet        |
   |                                     |──────────────────────────────────>|
   |                                     |                                   |
   |                                     |                                   |
=== DAY OF EVENT ===                    |                                   |
   |                                     |                                   |
   |  Attendee arrives                   |                                   |
   |  Presents QR code                   |                                   |
   |<────────────────────────────────────|──────────────────────────────────|
   |                                     |                                   |
   |  Scan QR → verify signature         |                                   |
   |  Mark ticket as "used"              |                                   |
   |------------------------------------>|                                   |
   |                                     |  Mint POAP badge to attendee      |
   |                                     |──────────────────────────────────>|
   |                                     |                                   |
   |  View attendance dashboard          |                                   |
   |<────────────────────────────────────|                                   |
```

---

## Why Stellar (Not Another Chain)

This is the critical grant differentiator. Every feature maps to a Stellar-native primitive that requires no external dependencies:

### 1. Ticket Minting — Two Paths

**Path A: Soroban Smart Contracts (SEP-0048 NFT Standard)**
- Programmable ticket logic: transfer restrictions, resale price caps, royalties, expiration, burn-on-use
- Full control over ticket lifecycle via Rust contracts
- Best for complex ticketing (tiered access, VIP perks, dynamic pricing)

**Path B: Native Asset Issuance (No Smart Contract)**
- Issue 1 unit of a unique Stellar asset = one NFT ticket
- No smart contract deployment, no Soroban complexity
- Best for simple ticketing (general admission, small events)
- Minting cost: $0.00001 per ticket

### 2. Anti-Fraud — Asset Freeze & Clawback (Stellar-Unique)

No other major blockchain offers this natively:

- **Freeze** a ticket — the holder cannot transfer it. Use case: flagged scalper, stolen ticket, chargeback.
- **Clawback** a ticket — the issuer reclaims it entirely. Use case: refund processing, fraud reversal, terms of service violation.

On Ethereum/Polygon, this requires complex smart contract logic and still can't guarantee revocation. On Stellar, it's a protocol-level flag on the asset.

### 3. Conditional Ticket Distribution — Claimable Balances

Stellar's Claimable Balances let organizers:
- Airdrop tickets to recipients who don't yet have a Stellar wallet
- Create time-locked ticket reservations (e.g., "claim within 24 hours or it returns to inventory")
- Implement waitlist mechanics with predicate logic (AND/OR/BEFORE/AFTER conditions)

No smart contract needed. This is native protocol functionality.

### 4. Ticket Resale — Built-in DEX

Stellar has a native decentralized exchange at the protocol layer (order book + AMM). Ticket NFTs can be:
- Listed for sale on the DEX with zero listing fees
- Traded peer-to-peer with instant settlement
- Enforced with price caps via Soroban contracts (organizer sets max resale price)

Other chains require building a custom marketplace or integrating with OpenSea/Blur. Stellar's DEX is built into the chain.

### 5. POAP Badges — Non-Transferable NFTs

Proof-of-attendance badges are minted as NFTs with the `auth_required` flag:
- Only the issuer (event organizer) can authorize transfers
- The issuer simply never authorizes transfers → badge is soulbound
- Minted upon QR check-in verification
- Displayed in the attendee's Stellar Pass profile

Cost to mint a POAP: $0.00001. At a 50,000-person festival, minting POAPs for every attendee costs $0.50 total. On Ethereum, the same operation would cost $500-50,000.

### 6. Muxed Accounts — Session & Order Management

Each ticket purchase session gets a unique muxed account (sub-account of the organizer's Stellar account):
- Match incoming payments to specific orders without on-chain state
- Simplify refund processing
- Reduce account creation overhead

### 7. USDC Settlement — Instant Organizer Payouts

Ticket sales settle in USDC on Stellar:
- Organizers receive funds in ~5 seconds (not 2-7 business days like Stripe)
- Optionally withdraw to fiat via SEP-24 anchor integration
- No chargebacks (crypto finality) — eliminates a $20B/year fraud problem in ticketing

---

## Technical Architecture

### System Overview

Stellar Pass is a four-layer system: a client-facing frontend, a backend API layer, Soroban smart contracts on Stellar, and a custom indexer that bridges on-chain state to the application.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Organizer   │  │  Attendee    │  │  Embeddable  │  │  Check-in       │ │
│  │  Dashboard   │  │  Web App     │  │  Widget      │  │  Scanner (PWA)  │ │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Web Comp.) │  │  (Camera API)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│         │                 │                 │                    │           │
├─────────┴─────────────────┴─────────────────┴────────────────────┴───────────┤
│                              API LAYER                                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Backend API (Node.js / Go)                     │   │
│  │                                                                       │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │   │
│  │  │  Event     │ │  Purchase  │ │  Check-in  │ │  SEP-10 Auth     │  │   │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service         │  │   │
│  │  │            │ │            │ │            │ │                  │  │   │
│  │  │  CRUD      │ │  Session   │ │  QR verify │ │  Challenge       │  │   │
│  │  │  events    │ │  mgmt      │ │  Signature │ │  sign/verify     │  │   │
│  │  │  tiers     │ │  Payment   │ │  POAP mint │ │  JWT issuance    │  │   │
│  │  │  metadata  │ │  tracking  │ │  trigger   │ │                  │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘  │   │
│  │                                                                       │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │   │
│  │  │  Webhook   │ │  Ticket    │ │  Analytics │ │  Stellar Tx      │  │   │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Builder         │  │   │
│  │  │            │ │            │ │            │ │                  │  │   │
│  │  │  Dispatch  │ │  Ownership │ │  Attendance│ │  Construct       │  │   │
│  │  │  Retry     │ │  queries   │ │  rates     │ │  sign, submit    │  │   │
│  │  │  Logging   │ │  History   │ │  POAP stats│ │  Stellar txns    │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                          │                        │
├─────────┴──────────────────────────────────────────┴────────────────────────┤
│                         SMART CONTRACT LAYER                                 │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │  Ticket NFT      │  │  POAP Badge      │  │  Resale Escrow            │  │
│  │  Contract        │  │  Contract        │  │  Contract                 │  │
│  │  (Soroban/Rust)  │  │  (Soroban/Rust)  │  │  (Soroban/Rust)           │  │
│  │                  │  │                  │  │                           │  │
│  │  SEP-0048 impl   │  │  Non-transferable│  │  Price cap enforcement    │  │
│  │  mint/transfer   │  │  mint only       │  │  Escrow hold/release      │  │
│  │  freeze/clawback │  │  auth_required   │  │  Royalty splits           │  │
│  │  burn-on-use     │  │  event-linked    │  │  DEX order placement      │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────────┘  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                           INDEXER LAYER                                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Stellar Ledger Watcher                            │   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │  Payment     │  │  Ownership   │  │  Attendance  │               │   │
│  │  │  Detector    │  │  Tracker     │  │  Recorder    │               │   │
│  │  │              │  │              │  │              │               │   │
│  │  │  Watch muxed │  │  Track NFT   │  │  Index check │               │   │
│  │  │  accounts    │  │  transfers   │  │  -in events  │               │   │
│  │  │  for inflow  │  │  freeze      │  │  POAP claims │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                         STELLAR NETWORK                                      │
│                                                                              │
│  Native Primitives:              Standards:                                  │
│  - Asset freeze / clawback       - SEP-0048 (Soroban NFT)                   │
│  - Claimable balances            - SEP-0049 (Soroban Token)                 │
│  - Muxed accounts (M-addresses)  - SEP-0010 (Auth)                          │
│  - Built-in DEX (SDEX)           - SEP-0024 (Fiat ramps)                    │
│  - Native asset issuance         - SEP-0012 (KYC)                           │
│  - AMM liquidity pools                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Stack & Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS | SSR for SEO (event pages), React ecosystem, fast iteration |
| **Embeddable Widget** | Web Components (Lit or Stencil) | Framework-agnostic — works in any site (React, Vue, plain HTML) |
| **Check-in Scanner** | PWA with Camera API | No app store install required; works offline after first load |
| **Backend API** | Node.js (Fastify) or Go (Fiber) | Fastify for TypeScript full-stack; Go if performance-critical |
| **Database** | PostgreSQL + Redis | Postgres for event/ticket metadata; Redis for session cache, rate limiting |
| **Smart Contracts** | Rust on Soroban | Soroban is Stellar's native smart contract platform; Rust for safety |
| **Indexer** | Custom Stellar Horizon watcher | Poll Horizon API for ledger events; index into Postgres |
| **Auth** | SEP-10 challenge-response | Stellar-native wallet auth — no passwords, no OAuth |
| **QR Codes** | `qrcode` npm + Ed25519 signatures | Signed QR codes with short TTL to prevent spoofing |
| **Hosting** | Vercel (frontend), Fly.io or Railway (backend), Stellar testnet/mainnet (contracts) | Low-cost, fast deployment |

---

### Layer 1: Frontend

#### Organizer Dashboard (`/dashboard`)

```
/dashboard
├── /events                    # List all organizer events
├── /events/new                # Create event wizard
├── /events/[id]               # Event detail
│   ├── /overview              # Sales, attendance, analytics
│   ├── /tickets               # Ticket tiers, inventory, minting status
│   ├── /check-in              # Live check-in scanner + manual entry
│   ├── /poap                  # POAP configuration, claim stats
│   └── /settings              # Webhooks, branding, payout config
├── /profile                   # Organizer profile, Stellar account
└── /settings                  # Account settings, API keys
```

**Key Components:**

| Component | Description |
|---|---|
| `EventWizard` | Multi-step form: name, description, date, venue, ticket tiers, pricing, supply |
| `TicketTierEditor` | Configure tiers (GA, VIP, Early Bird) with price, supply, transfer rules |
| `LiveCheckIn` | Camera-based QR scanner + manual ticket ID entry; real-time attendance counter |
| `SalesChart` | Revenue, tickets sold, check-in rate over time (Recharts / Chart.js) |
| `AttendeeTable` | Paginated list of ticket holders with wallet address, tier, check-in status |
| `POAPConfig` | Badge design upload, auto-mint toggle, claim deadline |
| `WebhookConfig` | Add/remove webhook endpoints, view delivery logs |

#### Attendee Web App (`/event/[slug]`)

```
/event/[slug]                  # Public event page
├── /                          # Event details, ticket tiers, purchase button
├── /checkout                  # Wallet connect + payment confirmation
├── /success                   # Purchase confirmation + ticket QR code
/tickets                       # My tickets (requires auth)
├── /                          # All purchased tickets across events
├── /[ticket-id]               # Ticket detail + QR code + transfer/resell options
/poaps                         # My POAP badges
├── /                          # Gallery of all collected POAP badges
└── /[poap-id]                 # POAP detail + social share
/profile/[wallet-address]      # Public profile (tickets + POAPs)
```

**Key Components:**

| Component | Description |
|---|---|
| `EventHero` | Event image, name, date, venue, countdown timer |
| `TierSelector` | Ticket tier cards with price, availability, buy button |
| `WalletConnect` | Stellar wallet connection (Freighter, Albedo, xBull, Lobstr) |
| `PaymentConfirmation` | Shows payment amount, asset, QR code for manual payment, or wallet prompt |
| `TicketCard` | Visual ticket with event info, tier, QR code, and animated confetti on check-in |
| `POAPGallery` | Grid of collected POAP badges with event name and date |
| `SocialShare` | One-click share to Twitter/X, Farcaster, or copy link |

#### Embeddable Widget (`<stellar-pass-ticket>`)

```html
<!-- Drop-in widget for any website -->
<script src="https://cdn.stellarpass.io/widget.js"></script>
<stellar-pass-ticket
  event-id="evt_abc123"
  tier="vip"
  theme="dark"
  button-text="Get Tickets"
></stellar-pass-ticket>
```

The widget is a Web Component that:
- Renders a ticket purchase button/card
- Opens a modal checkout flow on click
- Handles wallet connection and payment
- Calls back to the host page on success (`onSuccess`, `onError` events)

#### Check-in Scanner PWA (`/scan`)

A lightweight PWA for venue door staff:
- Opens camera, scans attendee QR code
- Sends signed payload to backend for verification
- Shows green (valid) / red (invalid/already used) feedback
- Works offline (queues check-ins, syncs when online)
- Installable to home screen (no app store needed)

---

### Layer 2: Backend API

#### Service Architecture

The backend is organized as a modular monolith (or microservices if scale demands):

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Fastify)                   │
│                                                            │
│  Middleware:                                                │
│  - Rate limiting (Redis)                                   │
│  - CORS                                                    │
│  - Request logging (Pino)                                  │
│  - JWT validation (from SEP-10 auth)                       │
│  - Request ID tracing                                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   /api/v1   │  │   /api/v1   │  │   /api/v1       │  │
│  │   /events   │  │   /tickets  │  │   /check-in     │  │
│  │   ────────  │  │   ────────  │  │   ─────────     │  │
│  │   POST /    │  │   POST /    │  │   POST /verify  │  │
│  │   GET  /:id │  │   GET  /:id │  │   POST /batch   │  │
│  │   PATCH/:id │  │   GET  /my  │  │   GET  /status  │  │
│  │   DELETE/:id│  │             │  │                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   /api/v1   │  │   /api/v1   │  │   /api/v1       │  │
│  │   /poap     │  │   /auth     │  │   /webhooks     │  │
│  │   ────────  │  │   ────────  │  │   ─────────     │  │
│  │   GET  /my  │  │   POST /chall│ │   POST /        │  │
│  │   GET  /:id │  │   POST /sign │  │   GET  /        │  │
│  │   POST /claim│ │   GET  /me  │  │   DELETE /:id   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐                        │
│  │   /api/v1   │  │   /api/v1   │                        │
│  │   /organizer│  │   /analytics│                        │
│  │   ────────  │  │   ────────  │                        │
│  │   GET  /me  │  │   GET /:evt │                        │
│  │   PATCH /me │  │   GET /poap │                        │
│  │   GET  /payouts│ GET /sales  │                        │
│  └─────────────┘  └─────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

#### API Endpoints (Detailed)

**Authentication (SEP-10)**

```
POST /api/v1/auth/challenge
  Body: { "account": "GABC..." }
  Response: { "transaction": "<base64 xdr>" }
  # Server builds a SEP-10 challenge transaction

POST /api/v1/auth/token
  Body: { "transaction": "<signed base64 xdr>" }
  Response: { "token": "eyJ...", "account": "GABC..." }
  # Server verifies signature, issues JWT

GET /api/v1/auth/me
  Headers: { "Authorization": "Bearer <jwt>" }
  Response: { "account": "GABC...", "role": "organizer|attendee" }
```

**Events**

```
POST /api/v1/events
  Body: {
    "name": "Stellar Meetup Lagos",
    "description": "...",
    "date_start": "2026-08-15T18:00:00Z",
    "date_end": "2026-08-15T21:00:00Z",
    "venue": { "name": "...", "address": "...", "lat": 6.5, "lng": 3.3 },
    "ticket_tiers": [
      {
        "name": "General Admission",
        "price": 5.00,
        "currency": "USDC",
        "supply": 200,
        "transferable": true,
        "resale_price_cap": 10.00
      },
      {
        "name": "VIP",
        "price": 25.00,
        "currency": "USDC",
        "supply": 30,
        "transferable": false
      }
    ],
    "poap_enabled": true,
    "poap_badge_url": "https://...",
    "webhook_url": "https://organizer.com/webhook"
  }
  Response: { "event_id": "evt_abc123", "slug": "stellar-meetup-lagos" }
  # Backend: creates event in DB, mints ticket NFTs on Stellar, stores contract ID

GET /api/v1/events/:id
  Response: { ...event, "ticket_tiers": [...], "sales_count": 142, "status": "on_sale" }

PATCH /api/v1/events/:id
  Body: { "status": "sold_out" | "cancelled" | "past" }
```

**Tickets & Purchases**

```
POST /api/v1/tickets/purchase
  Body: {
    "event_id": "evt_abc123",
    "tier_id": "tier_ga",
    "buyer_wallet": "GXYZ...",
    "payment_asset": "USDC"
  }
  Response: {
    "session_id": "sess_789",
    "muxed_account": "MABC...12345",
    "amount": "5.00",
    "asset": "USDC:GBDX...",
    "expires_at": "2026-08-01T12:15:00Z"
  }
  # Backend: creates muxed account for this session, starts watching for payment

GET /api/v1/tickets/:id
  Response: {
    "ticket_id": "tkt_xyz",
    "event": { ... },
    "tier": "General Admission",
    "owner": "GXYZ...",
    "status": "valid" | "used" | "frozen" | "clawed_back",
    "qr_payload": "<signed base64>",
    "nft_asset_code": "SPAS_EVT_ABC_GA_001"
  }

GET /api/v1/tickets/my
  Headers: { "Authorization": "Bearer <jwt>" }
  Response: [ ...tickets ]
```

**Check-in**

```
POST /api/v1/check-in/verify
  Body: {
    "qr_payload": "<signed base64>",
    "organizer_wallet": "GABC..."
  }
  Response: {
    "valid": true,
    "ticket_id": "tkt_xyz",
    "attendee": "GXYZ...",
    "tier": "VIP",
    "already_checked_in": false,
    "poap_minted": true,
    "poap_tx_hash": "abc123..."
  }
  # Backend: verify QR signature, check ticket ownership on-chain via indexer,
  # mark ticket as used, trigger POAP mint, return result

POST /api/v1/check-in/batch
  Body: { "ticket_ids": ["tkt_1", "tkt_2", ...] }
  Response: { "results": [...] }
  # Bulk check-in for organizers with pre-scanned lists
```

**POAP Badges**

```
GET /api/v1/poaps/my
  Headers: { "Authorization": "Bearer <jwt>" }
  Response: [ { "poap_id": "poap_123", "event": {...}, "minted_at": "...", "tx_hash": "..." } ]

GET /api/v1/poaps/:id
  Response: { ...poap, "event": {...}, "attendee": "GXYZ...", "share_url": "https://stellarpass.io/poap/123" }
```

**Webhooks**

```
POST /api/v1/webhooks
  Body: {
    "url": "https://organizer.com/webhook",
    "events": ["ticket.purchased", "ticket.checked_in", "poap.minted", "ticket.frozen"]
  }
  Response: { "webhook_id": "wh_abc", "secret": "whsec_..." }

# Webhook payload (sent to organizer's URL):
{
  "event": "ticket.checked_in",
  "timestamp": "2026-08-15T19:30:00Z",
  "data": {
    "ticket_id": "tkt_xyz",
    "attendee": "GXYZ...",
    "tier": "VIP",
    "poap_minted": true
  }
}
```

**Analytics**

```
GET /api/v1/analytics/:event_id
  Response: {
    "tickets_sold": 142,
    "tickets_total": 230,
    "revenue": { "USDC": 1850.00, "XLM": 3200.00 },
    "check_in_rate": 0.78,
    "poap_claim_rate": 0.72,
    "top_referrers": [...],
    "geographic_distribution": { "NG": 45, "US": 30, "KE": 20, ... },
    "sales_over_time": [ { "date": "2026-08-01", "count": 12 }, ... ],
    "check_ins_over_time": [ { "hour": "18:00", "count": 45 }, ... ]
  }
```

#### Database Schema (PostgreSQL)

```sql
-- Organizers
CREATE TABLE organizers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stellar_account VARCHAR(56) NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    email           TEXT,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id    UUID REFERENCES organizers(id),
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT,
    date_start      TIMESTAMPTZ NOT NULL,
    date_end        TIMESTAMPTZ NOT NULL,
    venue_name      TEXT,
    venue_address   TEXT,
    venue_lat       DECIMAL,
    venue_lng       DECIMAL,
    image_url       TEXT,
    status          TEXT DEFAULT 'draft',  -- draft, on_sale, sold_out, cancelled, past
    poap_enabled    BOOLEAN DEFAULT false,
    poap_badge_url  TEXT,
    poap_contract_id TEXT,                 -- Soroban contract ID for POAP
    webhook_url     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Tiers
CREATE TABLE ticket_tiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id),
    name            TEXT NOT NULL,
    description     TEXT,
    price           DECIMAL NOT NULL,
    currency        TEXT DEFAULT 'USDC',  -- USDC, XLM, EURC
    supply          INT NOT NULL,
    minted          INT DEFAULT 0,
    transferable    BOOLEAN DEFAULT true,
    resale_price_cap DECIMAL,             -- NULL = no cap
    nft_contract_id TEXT,                 -- Soroban contract ID
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id         UUID REFERENCES ticket_tiers(id),
    event_id        UUID REFERENCES events(id),
    owner_wallet    VARCHAR(56) NOT NULL,
    nft_asset_code  TEXT NOT NULL UNIQUE,  -- Stellar asset code (SPAS_EVT_xxx)
    nft_asset_issuer VARCHAR(56),          -- Issuer account
    status          TEXT DEFAULT 'active', -- active, used, frozen, clawed_back
    purchase_tx_hash TEXT,
    purchase_price   DECIMAL,
    purchase_currency TEXT,
    checked_in_at   TIMESTAMPTZ,
    checked_in_by   VARCHAR(56),           -- Organizer wallet that scanned
    qr_secret       TEXT NOT NULL,         -- Ed25519 private key for signing QR
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Sessions
CREATE TABLE purchase_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id),
    tier_id         UUID REFERENCES ticket_tiers(id),
    buyer_wallet    VARCHAR(56) NOT NULL,
    muxed_account   VARCHAR(69) NOT NULL,  -- M-address for this session
    muxed_id        BIGINT NOT NULL,       -- 64-bit muxed ID
    amount          DECIMAL NOT NULL,
    asset           TEXT NOT NULL,
    status          TEXT DEFAULT 'pending', -- pending, confirmed, expired, failed
    payment_tx_hash TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- POAP Badges
CREATE TABLE poap_badges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id),
    ticket_id       UUID REFERENCES tickets(id),
    attendee_wallet VARCHAR(56) NOT NULL,
    nft_asset_code  TEXT NOT NULL UNIQUE,
    mint_tx_hash    TEXT,
    metadata_uri    TEXT,                   -- IPFS or Arweave URI for badge image
    minted_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id    UUID REFERENCES organizers(id),
    url             TEXT NOT NULL,
    secret          TEXT NOT NULL,
    events          TEXT[] NOT NULL,        -- ['ticket.purchased', 'ticket.checked_in', ...]
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Delivery Log
CREATE TABLE webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id      UUID REFERENCES webhooks(id),
    event_type      TEXT NOT NULL,
    payload         JSONB NOT NULL,
    response_code   INT,
    response_body   TEXT,
    delivered_at    TIMESTAMPTZ DEFAULT NOW(),
    success         BOOLEAN
);

-- Indexes
CREATE INDEX idx_tickets_owner ON tickets(owner_wallet);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_poap_attendee ON poap_badges(attendee_wallet);
CREATE INDEX idx_sessions_muxed ON purchase_sessions(muxed_account);
CREATE INDEX idx_sessions_status ON purchase_sessions(status);
```

---

### Layer 3: Soroban Smart Contracts

#### Contract 1: Ticket NFT (`stellar_pass_ticket`)

Implements SEP-0048 (Soroban NFT Standard) with ticketing-specific extensions.

```rust
// Contract interface
pub trait TicketNFT {
    // --- SEP-0048 Core ---
    fn initialize(env: Env, admin: Address, name: String, symbol: String);
    fn mint(env: Env, to: Address, token_id: u128, metadata: TicketMetadata) -> u128;
    fn transfer(env: Env, from: Address, to: Address, token_id: u128);
    fn approve(env: Env, approved: Address, token_id: u128, live_until_ledger: u32);
    fn owner_of(env: Env, token_id: u128) -> Address;
    fn balance(env: Env, owner: Address) -> u128;
    fn name(env: Env) -> String;
    fn symbol(env: Env) -> String;

    // --- Ticketing Extensions ---
    fn freeze(env: Env, ticket_id: u128);           // Organizer freezes a ticket
    fn unfreeze(env: Env, ticket_id: u128);         // Organizer unfreezes a ticket
    fn clawback(env: Env, ticket_id: u128);         // Organizer reclaims a ticket
    fn burn(env: Env, ticket_id: u128);             // Burn ticket on check-in
    fn mark_used(env: Env, ticket_id: u128);        // Mark as checked-in (non-destructive)
    fn is_transferable(env: Env, ticket_id: u128) -> bool;
    fn get_resale_cap(env: Env, ticket_id: u128) -> Option<i128>;
    fn get_metadata(env: Env, ticket_id: u128) -> TicketMetadata;
    fn get_event_id(env: Env, ticket_id: u128) -> Bytes;
}

#[derive(Clone)]
pub struct TicketMetadata {
    pub event_id: Bytes,         // Event identifier
    pub tier: String,            // "GA", "VIP", "Early Bird"
    pub event_date: u64,         // Unix timestamp
    pub venue: String,           // Venue name
    pub image_url: String,       // Ticket artwork URL
    pub is_transferable: bool,   // Transfer restriction flag
    pub resale_price_cap: Option<i128>,  // Max resale price (in stroops)
    pub status: TicketStatus,    // active, used, frozen, clawed_back
}

pub enum TicketStatus {
    Active,
    Used,
    Frozen,
    ClawedBack,
}
```

**Storage Layout:**

| Key Pattern | Type | TTL | Description |
|---|---|---|---|
| `admin` | Address | Instance | Contract admin (organizer platform) |
| `event_{event_id}` | EventInfo | Persistent | Event metadata |
| `ticket_{token_id}` | TicketMetadata | Persistent | Per-ticket metadata |
| `owner_{token_id}` | Address | Persistent | Current ticket owner |
| `balance_{address}` | u128 | Persistent | Ticket balance per address |
| `approval_{token_id}` | Address | Persistent | Approved transfer recipient |
| `minted_count` | u128 | Instance | Total tickets minted |

**Key Behaviors:**
- `transfer` checks `is_transferable` flag and `status != Frozen` before executing
- `freeze` / `unfreeze` callable only by admin (organizer)
- `clawback` callable only by admin; returns ticket to issuer, sets status to `ClawedBack`
- `mark_used` callable only by admin (check-in service); sets status to `Used`
- `burn` callable only by admin after check-in (optional — some events keep tickets as collectibles)

#### Contract 2: POAP Badge (`stellar_pass_poap`)

Non-transferable attendance badge — soulbound NFT.

```rust
pub trait POAPBadge {
    fn initialize(env: Env, admin: Address, event_id: Bytes);
    fn mint(env: Env, to: Address, badge_id: u128, metadata: POAPMetadata) -> u128;
    fn owner_of(env: Env, badge_id: u128) -> Address;
    fn balance(env: Env, owner: Address) -> u128;
    fn get_metadata(env: Env, badge_id: u128) -> POAPMetadata;
    fn badges_of(env: Env, owner: Address) -> Vec<u128>;
}

#[derive(Clone)]
pub struct POAPMetadata {
    pub event_id: Bytes,
    pub event_name: String,
    pub event_date: u64,
    pub attendee: Address,
    pub badge_image_url: String,    // IPFS/Arweave URI
    pub minted_at: u64,
}
```

**Non-transferability enforcement:**
- The contract does NOT implement `transfer` or `approve`
- The underlying token has `auth_required` flag set to `true`
- The admin (platform) never calls `set_authorized` on any holder
- Result: badges are permanently soulbound to the attendee's wallet

**Storage:**
- Same pattern as ticket contract but no transfer/approval storage
- Additional index: `badges_{address}` → `Vec<u128>` for efficient per-user queries

#### Contract 3: Resale Escrow (`stellar_pass_escrow`)

Handles secondary market sales with price cap enforcement.

```rust
pub trait ResaleEscrow {
    fn create_listing(
        env: Env,
        seller: Address,
        ticket_contract: Address,
        ticket_id: u128,
        ask_price: i128,
        currency: Address,          // USDC or XLM contract
        royalty_bps: u32,           // Basis points (e.g., 500 = 5%)
    );

    fn buy(env: Env, buyer: Address, listing_id: u128);

    fn cancel_listing(env: Env, seller: Address, listing_id: u128);

    fn get_listing(env: Env, listing_id: u128) -> Listing;
    fn get_active_listings(env: Env, event_id: Bytes) -> Vec<Listing>;
}

pub struct Listing {
    pub listing_id: u128,
    pub seller: Address,
    pub ticket_contract: Address,
    pub ticket_id: u128,
    pub ask_price: i128,
    pub currency: Address,
    pub royalty_bps: u32,
    pub price_cap: i128,            // From ticket metadata
    pub status: ListingStatus,      // active, sold, cancelled
}
```

**Flow:**
1. Seller calls `create_listing` → ticket NFT transferred to escrow contract
2. Price is validated against the ticket's `resale_price_cap` from the ticket contract
3. Buyer calls `buy` → payment transferred to seller, royalty to organizer, ticket to buyer
4. On DEX: the escrow contract can also place a Stellar DEX order for the ticket asset

**Royalty split on sale:**
```
sale_price = 100 USDC
royalty_bps = 500 (5%)
organizer_receives = sale_price * royalty_bps / 10000 = 5 USDC
seller_receives = sale_price - organizer_receives = 95 USDC
```

#### Contract Interaction Diagram

```
                        ┌─────────────────┐
                        │   Stellar Pass   │
                        │   Backend API    │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Ticket NFT  │ │  POAP Badge  │ │  Resale      │
        │  Contract    │ │  Contract    │ │  Escrow      │
        │              │ │              │ │  Contract    │
        │  mint()      │ │  mint()      │ │              │
        │  transfer()  │ │  (no transfer│ │  create_     │
        │  freeze()    │ │   - soulbound│ │  listing()   │
        │  clawback()  │ │  )           │ │  buy()       │
        │  mark_used() │ │              │ │  cancel()    │
        └──────┬───────┘ └──────────────┘ └──────┬───────┘
               │                                  │
               │    ┌──────────────────┐          │
               └───>│  Stellar Network │<─────────┘
                    │                  │
                    │  - DEX (SDEX)    │
                    │  - AMM Pools     │
                    │  - Asset Issuance│
                    └──────────────────┘
```

---

### Layer 4: Indexer

The indexer watches the Stellar ledger in real-time and populates the application database.

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Stellar Horizon API                     │
│              (or Stellar RPC / Soroban RPC)               │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │  Poll /stream or /events
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Indexer Worker                         │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Payment        │  │  Contract       │                │
│  │  Stream         │  │  Event          │                │
│  │  Processor      │  │  Processor      │                │
│  │                 │  │                 │                │
│  │  Watches muxed  │  │  Watches Soroban│                │
│  │  accounts for   │  │  contract events│                │
│  │  incoming       │  │  (mint, burn,   │                │
│  │  payments       │  │  transfer, etc.)│                │
│  └────────┬────────┘  └────────┬────────┘                │
│           │                    │                           │
│           ▼                    ▼                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Event Dispatcher                      │    │
│  │                                                    │    │
│  │  payment.confirmed  →  Update session status       │    │
│  │                    →  Trigger ticket mint          │    │
│  │                    →  Send webhook                 │    │
│  │                                                    │    │
│  │  nft.transferred   →  Update ownership in DB       │    │
│  │                    →  Log transfer event           │    │
│  │                                                    │    │
│  │  nft.frozen        →  Update ticket status         │    │
│  │                    →  Notify owner                  │    │
│  │                                                    │    │
│  │  poap.minted       →  Update attendance record     │    │
│  │                    →  Send webhook                 │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### Indexer Responsibilities

| Stream | What It Watches | What It Does |
|---|---|---|
| **Payment Detection** | Incoming payments to muxed accounts (M-addresses) created for purchase sessions | Matches payment to session → updates session status to `confirmed` → triggers ticket NFT mint → sends `ticket.purchased` webhook |
| **Ticket Ownership** | Soroban contract events (`transfer`, `freeze`, `clawback`) | Updates `tickets.owner_wallet` in DB, updates `tickets.status`, logs event |
| **POAP Minting** | Soroban POAP contract `mint` event | Creates `poap_badges` record, links to ticket, sends `poap.minted` webhook |
| **DEX Listings** | Stellar DEX orders for ticket assets | Indexes active resale listings for the marketplace UI |
| **Claimable Balances** | Claimable balance creation and claims | Tracks airdropped ticket claims, updates status when claimed |

#### Indexer State Machine (Purchase Session)

```
                    ┌──────────┐
                    │  pending  │  Session created, watching for payment
                    └────┬─────┘
                         │
            Payment received on muxed account
                         │
                         ▼
                    ┌──────────┐
                    │ confirmed │  Payment detected by indexer
                    └────┬─────┘
                         │
            Ticket NFT minted and transferred to buyer
                         │
                         ▼
                    ┌──────────┐
                    │ completed │  Buyer holds ticket NFT
                    └──────────┘

                    ┌──────────┐
                    │  expired  │  No payment within timeout (e.g., 15 min)
                    └──────────┘
```

---

### Data Flow: Ticket Purchase (End-to-End)

```
  Attendee          Frontend           Backend           Indexer          Stellar
  ────────          ────────           ───────           ───────          ───────
     │                 │                  │                  │                │
     │  Click "Buy"    │                  │                  │                │
     │────────────────>│                  │                  │                │
     │                 │                  │                  │                │
     │                 │  POST /purchase  │                  │                │
     │                 │─────────────────>│                  │                │
     │                 │                  │                  │                │
     │                 │                  │  Create muxed    │                │
     │                 │                  │  account for     │                │
     │                 │                  │  this session    │                │
     │                 │                  │─────────────────────────────────>│
     │                 │                  │                  │                │
     │                 │                  │  Store session   │                │
     │                 │                  │  in DB           │                │
     │                 │                  │──────>│          │                │
     │                 │                  │       │          │                │
     │  Show payment   │                  │       │          │                │
     │  details (amount│                  │       │          │                │
     │  + muxed addr)  │<─────────────────│       │          │                │
     │<────────────────│                  │       │          │                │
     │                 │                  │       │          │                │
     │  Send payment   │                  │       │          │                │
     │  from wallet    │                  │       │          │                │
     │────────────────────────────────────────────────────────────────────>│
     │                 │                  │       │          │                │
     │                 │                  │       │  ┌───────┴──────┐        │
     │                 │                  │       │  │ Poll Horizon │        │
     │                 │                  │       │  │ for payment  │        │
     │                 │                  │       │  │ to muxed     │        │
     │                 │                  │       │  │ account      │        │
     │                 │                  │       │  └───────┬──────┘        │
     │                 │                  │       │          │                │
     │                 │                  │       │  Payment detected!       │
     │                 │                  │       │<─────────│               │
     │                 │                  │       │          │               │
     │                 │                  │  Update session  │               │
     │                 │                  │  to "confirmed"  │               │
     │                 │                  │<──────│          │               │
     │                 │                  │       │          │               │
     │                 │                  │  Build + sign    │               │
     │                 │                  │  mint transaction│               │
     │                 │                  │────────────────────────────────>│
     │                 │                  │                  │               │
     │                 │                  │  Ticket NFT      │               │
     │                 │                  │  minted on-chain │               │
     │                 │                  │<────────────────────────────────│
     │                 │                  │                  │               │
     │                 │                  │  Transfer NFT    │               │
     │                 │                  │  to buyer wallet │               │
     │                 │                  │────────────────────────────────>│
     │                 │                  │                  │               │
     │                 │                  │  Send webhook    │               │
     │                 │                  │  ticket.purchased│               │
     │                 │                  │──────>│          │               │
     │                 │                  │       │          │               │
     │  Show success   │                  │       │          │               │
     │  + ticket QR    │                  │       │          │               │
     │<────────────────│                  │       │          │               │
     │                 │                  │       │          │               │
```

### Data Flow: Check-in & POAP Minting

```
  Door Staff        Scanner PWA        Backend           Indexer          Stellar
  ──────────        ───────────        ───────           ───────          ───────
     │                  │                 │                  │                │
     │  Scan QR code    │                 │                  │                │
     │─────────────────>│                 │                  │                │
     │                  │                 │                  │                │
     │                  │  POST /verify   │                  │                │
     │                  │  { qr_payload } │                  │                │
     │                  │────────────────>│                  │                │
     │                  │                 │                  │                │
     │                  │                 │  Verify QR sig   │                │
     │                  │                 │  (Ed25519)       │                │
     │                  │                 │                  │                │
     │                  │                 │  Query indexer   │                │
     │                  │                 │  for ticket      │                │
     │                  │                 │  ownership       │                │
     │                  │                 │─────────────────>│                │
     │                  │                 │                  │                │
     │                  │                 │  Confirm owner   │                │
     │                  │                 │  matches wallet  │                │
     │                  │                 │<─────────────────│                │
     │                  │                 │                  │                │
     │                  │                 │  Build mark_used │                │
     │                  │                 │  transaction     │                │
     │                  │                 │────────────────────────────────>│
     │                  │                 │                  │                │
     │                  │                 │  Build POAP mint │                │
     │                  │                 │  transaction     │                │
     │                  │                 │────────────────────────────────>│
     │                  │                 │                  │                │
     │                  │                 │  Both confirmed  │                │
     │                  │                 │<────────────────────────────────│
     │                  │                 │                  │                │
     │                  │                 │  Update DB:      │                │
     │                  │                 │  - ticket.used   │                │
     │                  │                 │  - poap.minted   │                │
     │                  │                 │──────>│          │                │
     │                  │                 │       │          │                │
     │                  │  Response:      │       │          │                │
     │                  │  { valid, tier, │       │          │                │
     │                  │   poap_minted } │       │          │                │
     │                  │<────────────────│       │          │                │
     │<─────────────────│                 │       │          │                │
     │                  │                 │       │          │                │
     │  Show GREEN ✓    │                 │       │          │                │
     │  "Checked in!"   │                 │       │          │                │
     │  "POAP earned!"  │                 │       │          │                │
```

---

### Security Architecture

#### Authentication Flow (SEP-10)

```
1. Client sends Stellar public key to POST /auth/challenge
2. Server builds SEP-10 challenge transaction:
   - Contains a unique memo
   - Has a time bound (valid for 5 minutes)
   - Server signs with its Stellar account
3. Client signs the challenge transaction with their Stellar secret key
4. Client sends signed transaction to POST /auth/token
5. Server verifies:
   - Server's signature is valid
   - Client's signature matches the claimed public key
   - Time bound has not expired
   - Memo is unique (prevent replay)
6. Server issues a JWT containing:
   - sub: Stellar public key
   - role: "organizer" or "attendee" (determined by DB lookup)
   - exp: 24 hours
7. All subsequent API calls include JWT in Authorization header
```

#### QR Code Security

QR codes are signed to prevent forgery:

```
QR Payload Structure:
{
  "ticket_id": "tkt_xyz",
  "event_id": "evt_abc",
  "owner": "GXYZ...",
  "tier": "VIP",
  "issued_at": 1692000000,
  "expires_at": 1692000900,     // 15 min TTL
  "nonce": "random-uuid"
}

Signature:
- Backend signs the payload with an Ed25519 keypair per event
- Public key stored on-chain (in ticket contract) and in DB
- QR code contains: base64(payload) + base64(signature)
- Scanner verifies signature with event's public key
- Checks expires_at to reject stale QR codes
```

#### Smart Contract Security

| Concern | Mitigation |
|---|---|
| **Unauthorized minting** | Only admin (platform backend) can call `mint`. Admin key stored in HSM or multisig. |
| **Unauthorized transfer** | `transfer` checks `is_transferable` flag and `status != Frozen` |
| **Unauthorized freeze/clawback** | Only admin callable. Admin must be the event organizer's authorized account. |
| **Reentrancy** | Soroban's execution model prevents reentrancy by default |
| **Integer overflow** | Rust's default overflow checks + Soroban's `i128` for token amounts |
| **Storage exhaustion** | TTL management — extend storage entries for long-duration events |
| **Front-running** | Muxed account matching is done server-side, not on-chain. DEX listings use standard Stellar DEX order book (no MEV). |

#### Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `POST /auth/challenge` | 10 requests | per minute per IP |
| `POST /auth/token` | 5 requests | per minute per IP |
| `POST /tickets/purchase` | 3 requests | per minute per wallet |
| `POST /check-in/verify` | 30 requests | per minute per organizer |
| `GET /events/:id` | 60 requests | per minute per IP |

---

### Infrastructure & Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTION                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Vercel      │  │   Fly.io     │  │   Stellar        │  │
│  │   (Frontend)  │  │   (Backend)  │  │   Mainnet        │  │
│  │              │  │              │  │                  │  │
│  │  Next.js app  │  │  API server  │  │  Soroban         │  │
│  │  Edge CDN     │  │  PostgreSQL  │  │  contracts       │  │
│  │  Auto-deploy  │  │  Redis       │  │  deployed        │  │
│  │  from main    │  │  Indexer     │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Cloudflare   │  │  Upstash     │  │   Circle USDC    │  │
│  │  (DNS + CDN)  │  │  (Redis)     │  │   (Stablecoin)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Local Next.js│  │  Docker      │  │  Stellar         │  │
│  │  dev server   │  │  Compose:    │  │  Testnet         │  │
│  │              │  │  - Postgres  │  │                  │  │
│  │              │  │  - Redis     │  │  Soroban         │  │
│  │              │  │  - API       │  │  local sandbox   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Deployment Pipeline

```
Push to main
    │
    ▼
┌──────────────┐
│  GitHub       │
│  Actions CI   │
│              │
│  1. Lint     │
│  2. Type check│
│  3. Unit test │
│  4. Build    │
└──────┬───────┘
       │
       ├──> Vercel (frontend) — auto-deploy on merge
       │
       ├──> Fly.io (backend) — deploy via flyctl
       │
       └──> Stellar Testnet — contract deploy via `soroban contract deploy`
            (manual promotion to mainnet after testnet validation)
```

#### Cost Estimate

| Component | Monthly Cost | Notes |
|---|---|---|
| Vercel (frontend) | $0 (Hobby) to $20 (Pro) | Edge CDN, SSR |
| Fly.io (backend) | $5-30 | Shared CPU, 256MB-1GB RAM |
| PostgreSQL (Fly.io or Supabase) | $0-25 | Shared or dedicated |
| Redis (Upstash) | $0-10 | Serverless, pay-per-request |
| Stellar transactions | ~$0.01 total | $0.00001/tx, even at 1000 tx/day |
| Soroban contract rent | ~$1-5 | Storage TTL extension |
| Domain + DNS | $12/year | Cloudflare free tier for DNS |
| **Total** | **$5-90/month** | Scales with usage |

---

### Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Soroban vs native asset for tickets** | Both — native for simple events, Soroban for advanced | Native issuance is simpler and cheaper ($0.00001). Soroban needed for freeze/clawback/transfer restrictions. Let organizer choose. |
| **POAP on same contract as tickets?** | Separate contracts | Tickets are transferable, POAPs are not. Different access control. Separating allows independent upgrades. |
| **Monolith vs microservices** | Modular monolith (initially) | Faster to build, easier to deploy. Split into services when a single module becomes a bottleneck. |
| **Postgres vs on-chain storage** | Both — critical state on-chain, metadata in Postgres | On-chain: ticket ownership, POAP ownership, freeze status. Off-chain: event descriptions, analytics, webhooks. On-chain is source of truth for ownership. |
| **PWA vs native mobile app** | PWA | No app store approval. Works offline. Installable. Camera API for QR scanning. Can wrap in Capacitor later if needed. |
| **JWT vs session cookies** | JWT (from SEP-10) | Stateless auth works across frontend, backend, and mobile. SEP-10 proves Stellar account ownership cryptographically. |

---

## MVP Scope

### Phase 1 — Core Ticketing (Weeks 1-4)

| Deliverable | Description |
|---|---|
| Event creation API | Organizer creates event with tiers, pricing, supply, dates |
| Ticket NFT contract | Soroban contract implementing SEP-0048 with freeze/clawback, transfer restrictions |
| Purchase flow | Attendee connects Stellar wallet → pays USDC/XLM → receives ticket NFT |
| Hosted event page | Public event page with ticket tiers, countdown, purchase button |
| QR code generation | Unique signed QR code per ticket for check-in |
| Testnet deployment | Full flow on Stellar testnet |

### Phase 2 — POAP & Check-in (Weeks 5-8)

| Deliverable | Description |
|---|---|
| POAP badge contract | Soroban contract for non-transferable attendance badges |
| QR check-in system | Organizer scans attendee QR → verifies signature → marks attendance → mints POAP |
| Attendee profile page | Shows all tickets and POAP badges in one view |
| Social sharing | Share POAP badge to Twitter/X with one click |
| Organizer dashboard | Event overview, sales stats, attendance tracker |
| Mainnet deployment | Production launch |

### Phase 3 — Advanced Features (Weeks 9-12)

| Deliverable | Description |
|---|---|
| Secondary market | Ticket resale on Stellar DEX with optional Soroban-enforced price caps |
| Claimable balance tickets | Airdrop tickets to users without wallets; time-locked claims |
| Fiat on-ramp | Buy tickets with credit card via SEP-24 anchor integration |
| Analytics dashboard | Attendance rates, geographic distribution, POAP claim rates, engagement metrics |
| Event reputation system | Organizer ratings based on past events and attendee feedback |
| Mobile check-in app | PWA or native app for venue door staff |

---

## Competitive Landscape

| Feature | Stellar Pass | GET Protocol (Polygon) | POAP (Gnosis) | Tokenproof (ETH) | Ticketmaster |
|---|---|---|---|---|---|
| **NFT tickets** | Yes (Soroban) | Yes | No (badges only) | No (verifies NFTs) | Limited pilots |
| **POAP badges** | Yes (built-in) | No | Yes (standalone) | No | No |
| **Ticket cost to mint** | $0.00001 | $0.001-0.05 | Free (subsidized) | N/A | N/A |
| **POAP cost to mint** | $0.00001 | N/A | Free (subsidized) | N/A | N/A |
| **Asset freeze/clawback** | Native | No | No | No | No |
| **Secondary market** | Built-in DEX | Custom marketplace | No | No | StubHub integration |
| **Fiat on-ramp** | SEP-24 anchors | Limited | No | No | Built-in |
| **Check-in system** | QR + wallet verify | QR scan | No (manual claim) | Wallet signature | Barcode scan |
| **Non-custodial** | Yes | Partial | Yes | Yes | No |
| **Fees** | ~1-2% | ~$0.30/ticket | Free | Free | 15-30% |

**Stellar Pass's moat:**
1. Only platform combining NFT tickets + POAP badges in one product
2. Only ticketing platform with native asset freeze/clawback (anti-fraud at protocol level)
3. Cheapest minting cost of any blockchain ticketing solution ($0.00001 vs $0.001+ on Polygon)
4. Built-in DEX for secondary market — no custom marketplace needed
5. Stellar's fiat infrastructure (SEPs, anchors) for organizer payouts

---

## Grant Pitch

### For Stellar Community Fund (SCF)

> The global event ticketing industry is worth $70B+ and plagued by counterfeits, scalping, and high platform fees. Blockchain ticketing solves these problems, but current solutions live on Ethereum/Polygon where transaction fees make free POAPs expensive and no chain offers native ticket revocation.
>
> Stellar Pass is the first event ticketing and proof-of-attendance platform built on Stellar. It uses Soroban smart contracts for NFT tickets (SEP-0048), native asset freeze/clawback for anti-fraud (no other chain has this), Claimable Balances for wallet-less ticket distribution, and Stellar's built-in DEX for secondary market trading — all at $0.00001 per transaction.
>
> The POAP component alone is a gap-filler: POAP does not support Stellar, and no native proof-of-attendance protocol exists on the network. Stellar Pass brings POAP functionality to every Stellar event — Meridian, community meetups, hackathons, and beyond — at near-zero cost.
>
> This project fills a clear vertical gap in the Stellar ecosystem. No ticketing or POAP project has been funded by SCF. It showcases Stellar's unique primitives (freeze/clawback, claimable balances, muxed accounts, built-in DEX) in a consumer-facing product with measurable adoption metrics.

### Key Differentiators for Grant Reviewers

1. **True white space** — no ticketing or POAP project exists on Stellar or in SCF history
2. **Showcases Stellar-unique features** — freeze/clawback, claimable balances, muxed accounts are core to the product, not bolted on
3. **Clear user stories:**
   - "A conference organizer sells 1,000 tickets as NFTs, mints POAP badges at check-in, and receives USDC settlement in 5 seconds"
   - "A community meetup airdrops tickets to 50 attendees via Claimable Balances — none of them had Stellar wallets before"
   - "A music festival uses asset freeze to revoke 200 scalped tickets and reissues them to legitimate buyers"
4. **Composable with Stellar ecosystem** — enhances Meridian, Stellar community events, and every future Stellar gathering
5. **Measurable impact** — events created, tickets minted, POAPs claimed, secondary market volume
6. **Market timing** — blockchain ticketing projected at $4-7B+ by 2027-2030; Stellar has the infra but zero product

---

## Stellar-Specific Feature Mapping

| Feature | Stellar Primitive Used | Why It Matters |
|---|---|---|
| Ticket NFTs | Soroban SEP-0048 or native asset issuance | Standardized, interoperable NFTs |
| Ticket revocation | Asset freeze / clawback (protocol-level) | Revoke scalped/stolen tickets instantly — impossible on most chains |
| Ticket airdrops | Claimable Balances | Onboard users without wallets; time-locked claims |
| Ticket resale | Built-in DEX (order book + AMM) | Transparent secondary market with no smart contract risk |
| Price caps on resale | Soroban contract enforcement | Organizers control scalping without sacrificing decentralization |
| Session management | Muxed accounts (M-addresses) | Match payments to orders without on-chain state |
| Attendee authentication | SEP-10 challenge-response | Wallet-based auth, no passwords |
| POAP badges | Non-transferable Soroban NFT (auth_required flag) | Soulbound proof-of-attendance |
| Organizer payouts | USDC on Stellar (~5s settlement) | Instant settlement, no chargebacks |
| Fiat on-ramp for buyers | SEP-24 anchor integration | Non-crypto users can buy tickets with credit card |
| Event page payments | Built-in DEX for asset conversion | Accept any Stellar asset, auto-convert to organizer's preferred |

---

## Use Cases

### 1. Stellar Meridian Conference
- Sell conference passes as NFTs (early bird, standard, VIP tiers)
- Issue POAP badges for each day attended
- Airdrop after-party tickets via Claimable Balances
- View aggregate attendance analytics post-event

### 2. Community Meetups & Hackathons
- Free RSVP tickets (mint cost: $0.00001 per ticket)
- POAP badges as proof of participation
- Prize distribution linked to POAP ownership (attended hackathon → eligible for prize)

### 3. Music Festivals & Large Venues
- 50,000 tickets minted at $0.50 total cost
- Asset freeze to revoke scalped tickets
- Secondary market on Stellar DEX with 10% price cap
- Real-time attendance tracking via QR check-in

### 4. Virtual Events & Webinars
- Ticket purchase + POAP claim fully online
- POAP badge proves attendance for credentialing
- Integration with video platforms for access gating

### 5. DAO Governance Events
- Ticket = voting weight at in-person governance events
- POAP proves attendance at governance sessions
- On-chain record of who participated in what decisions

---

## Sustainability Plan

### During Grant Period
- Free for all organizers and attendees
- Focus on adoption: target Stellar community events first (Meridian, SCF demo days, meetups)

### Post-Grant Revenue Model

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0/mo | 1 event/mo, up to 100 tickets, basic POAP, hosted event page |
| **Pro** | $49/mo | Unlimited events, up to 10K tickets/event, custom branding, analytics, secondary market |
| **Enterprise** | Custom | White-label, API access, dedicated support, custom integrations |

**Per-ticket fee option:** $0.10 per paid ticket on free tier (vs. $5-15 on Ticketmaster). Free tickets and POAPs always free.

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Events created | 200+ |
| Tickets minted | 10,000+ |
| POAPs claimed | 5,000+ |
| Active organizers | 50+ |
| Secondary market trades | 500+ |
| Unique wallets onboarded | 3,000+ (new Stellar users via Claimable Balance tickets) |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Soroban ecosystem immaturity** | Use native asset issuance for simple tickets (no Soroban needed). Reserve Soroban for advanced features (POAP, resale escrow). |
| **Low organizer adoption** | Target Stellar community events first (Meridian, meetups). Offer free tier. Partner with SCF for promotion. |
| **POAP competition** | POAP doesn't support Stellar and is unlikely to soon. Build the standard first; position as the Stellar-native POAP. |
| **Scalping arms race** | Freeze/clawback is a unique advantage. Combine with identity-verified ticket tiers for high-value events. |
| **QR code spoofing** | Signed QR codes with short expiry. Backend verification against ticket ownership in real-time. |
| **Low secondary market liquidity** | Built-in DEX provides baseline liquidity. Partner with Stellar DEX aggregators for visibility. |

---

## Open Questions

- [ ] Should ticket NFTs use Soroban (SEP-0048) or native asset issuance for the MVP? Soroban is more powerful but native issuance is simpler and cheaper.
- [ ] Should POAP badges be on a separate Soroban contract or the same contract as tickets?
- [ ] Should the platform be self-hostable (open source) or SaaS-only?
- [ ] Which Stellar anchor(s) to partner with for fiat ticket purchases (SEP-24)?
- [ ] Should we build a mobile check-in app (PWA vs native) in the MVP or Phase 3?
- [ ] How to handle ticket refunds — clawback + reissue, or claimable balance return?
- [ ] Should the platform support event series (recurring events) from day one?

---

## Comparison with Stellar Checkout (Separate Project)

| Dimension | Stellar Pass (This Project) | Stellar Checkout |
|---|---|---|
| **Focus** | Event ticketing + POAP badges | Merchant payment gateway |
| **User** | Event organizers, attendees | Online merchants, shoppers |
| **Stellar primitives showcased** | Freeze/clawback, claimable balances, DEX, muxed accounts | SEPs, anchors, muxed accounts, DEX |
| **Smart contract dependency** | Medium (Soroban for NFTs, POAP) | Low (mostly Stellar classic) |
| **Revenue model** | Per-ticket fee + SaaS tiers | Transaction fee + SaaS tiers |
| **SCF competition** | Zero ticketing/POAP projects | Zero merchant gateway projects |
| **Can they coexist?** | Yes — complementary, non-overlapping | Yes — different verticals |
