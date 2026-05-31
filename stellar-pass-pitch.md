# Stellar Pass

**The first NFT event ticketing and proof-of-attendance platform on Stellar.**

---

## Elevator Pitch

Stellar Pass lets event organizers sell tickets as NFTs and mint proof-of-attendance badges — all on Stellar, where transactions cost $0.00001 and settle in 5 seconds. No other blockchain offers native asset freeze/clawback to revoke scalped tickets, Claimable Balances to onboard users without wallets, or a built-in DEX for secondary market trading. The Stellar ecosystem has zero ticketing or POAP projects. We're building the first one.

---

## The Problem

The global event ticketing industry is worth $70B+ and broken:

**For organizers:**
- Ticketmaster charges 15-30% in fees
- Counterfeit tickets cost the industry $1B+ annually
- Scalpers buy in bulk and resell at 3-10x markup
- No on-chain proof of who actually attended
- Settlement takes 2-7 business days

**For attendees:**
- No ownership of their ticket (it's a barcode on a platform)
- No portable proof of attendance across events
- High fees passed down from organizers
- Scammed by fake tickets on secondary markets

**For the Stellar ecosystem:**
- POAP doesn't support Stellar — no proof-of-attendance protocol exists
- No ticketing platform uses Stellar's unique primitives (freeze/clawback, Claimable Balances, built-in DEX)
- Every Stellar community event (Meridian, meetups, hackathons) uses traditional ticketing or manual RSVPs

---

## The Solution

Stellar Pass is a full-stack platform where organizers create events, sell NFT tickets, and mint POAP badges — all powered by Stellar's native capabilities.

### What organizers get:

| Feature | How It Works |
|---|---|
| **NFT Tickets** | Mint tickets as Soroban NFTs (SEP-0048) or native Stellar assets. Each ticket is a unique on-chain token. |
| **Instant Settlement** | Ticket sales settle in USDC on Stellar in ~5 seconds. No waiting 2-7 days like Stripe. |
| **Anti-Fraud** | Freeze or clawback stolen/scalped tickets at the protocol level. No other chain can do this natively. |
| **QR Check-in** | Attendees present a signed QR code. Organizer scans to verify ownership and mark attendance. |
| **POAP Badges** | Non-transferable NFT badges auto-minted upon check-in. On-chain proof of attendance. |
| **Secondary Market** | Ticket resale on Stellar's built-in DEX with optional price caps enforced by Soroban contracts. |
| **Analytics** | Real-time dashboard: sales, attendance rates, geographic distribution, POAP claim rates. |

### What attendees get:

| Feature | How It Works |
|---|---|
| **True Ownership** | Ticket lives in your Stellar wallet, not on a platform. Transfer it, gift it, or keep it as a collectible. |
| **POAP Collection** | Every event you attend adds a soulbound badge to your on-chain identity. |
| **One-Click Purchase** | Connect Freighter/Albedo/Lobstr wallet → pay USDC/XLM → ticket delivered in 5 seconds. |
| **No Wallet? No Problem** | Organizers can airdrop tickets via Claimable Balances — claim with a new wallet later. |
| **Fair Resale** | Buy secondary market tickets on the Stellar DEX with transparent pricing and organizer-enforced caps. |

---

## Why Stellar

Stellar has unique primitives that make it the best chain for ticketing. These aren't nice-to-haves — they're the core of the product.

### 1. Asset Freeze & Clawback (Stellar-Unique)

**What it is:** The ticket issuer can freeze a ticket (holder can't transfer it) or clawback (reclaim it entirely) — as a native protocol feature.

**Why it matters for ticketing:**
- Scalper buys 50 tickets? Freeze them all. Reissue to legitimate buyers.
- Customer requests refund? Clawback the ticket, return funds. Instant.
- Fraudulent purchase detected? Clawback the ticket before the event.

**On other chains:** Requires complex smart contract logic and still can't guarantee revocation. On Stellar, it's a flag on the asset.

### 2. Claimable Balances (Native Conditional Escrow)

**What it is:** Lock tokens with predicate logic (time-based, account-based) that anyone can claim if conditions are met.

**Why it matters for ticketing:**
- Airdrop tickets to recipients who don't have a Stellar wallet yet
- Create time-locked reservations: "Claim within 24 hours or ticket returns to inventory"
- Waitlist mechanics: first person to claim gets the ticket

**On other chains:** Requires deploying custom escrow contracts. On Stellar, it's built into the protocol.

### 3. Built-in DEX (Protocol-Level Order Book + AMM)

**What it is:** Stellar has a decentralized exchange at the protocol layer — no smart contract needed.

**Why it matters for ticketing:**
- List ticket NFTs for resale with zero listing fees
- Instant peer-to-peer trade with 5-second settlement
- Soroban contract can enforce price caps on top of DEX trades

**On other chains:** Must build a custom marketplace or integrate OpenSea/Blur. On Stellar, the exchange is the chain.

### 4. Cost at Scale

| Operation | Stellar | Polygon | Ethereum |
|---|---|---|---|
| Mint 1 ticket | $0.00001 | $0.001-0.05 | $0.50-3.00 |
| Mint 10,000 tickets | $0.10 | $10-500 | $5,000-30,000 |
| Mint 50,000 POAPs | $0.50 | $50-2,500 | $25,000-150,000 |

Stellar is 100-5,000x cheaper than Polygon and 100,000x cheaper than Ethereum for high-volume minting.

### 5. Muxed Accounts (Session Management)

**What it is:** A single Stellar account can represent thousands of virtual sub-accounts using a 64-bit ID.

**Why it matters for ticketing:**
- Each purchase session gets a unique muxed account
- Match incoming payments to specific orders without on-chain state
- One organizer account manages all ticket sales

### 6. USDC Settlement (5-Second Finality)

- Organizers receive USDC in ~5 seconds, not 2-7 business days
- No chargebacks (crypto finality) — eliminates a $20B/year fraud problem
- Optional fiat withdrawal via SEP-24 anchor integration

---

## Competitive Landscape

| Feature | Stellar Pass | GET Protocol (Polygon) | POAP (Gnosis) | Tokenproof (ETH) | Ticketmaster |
|---|---|---|---|---|---|
| **NFT tickets** | Yes | Yes | No | No | Limited |
| **POAP badges** | Yes | No | Yes | No | No |
| **Mint cost/ticket** | $0.00001 | $0.001-0.05 | Free (subsidized) | N/A | N/A |
| **Asset freeze/clawback** | Native | No | No | No | No |
| **Secondary market** | Built-in DEX | Custom marketplace | No | No | StubHub |
| **Fiat on-ramp** | SEP-24 | Limited | No | No | Built-in |
| **Check-in system** | QR + wallet verify | QR scan | Manual claim | Wallet sig | Barcode |
| **Settlement speed** | 5 seconds | Minutes | N/A | N/A | 2-7 days |
| **Platform fees** | 1-2% | ~$0.30/ticket | Free | Free | 15-30% |

**What no one else has:**
1. Only platform combining NFT tickets + POAP badges in one product
2. Only ticketing platform with native asset freeze/clawback
3. Cheapest minting cost of any blockchain ticketing solution
4. Built-in DEX for secondary market — no custom marketplace needed
5. Stellar's fiat infrastructure (SEPs, anchors) for organizer payouts

---

## Technical Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                │
│  Organizer Dashboard · Attendee Web App · Widget · Scanner   │
├─────────────────────────────────────────────────────────────┤
│  API LAYER                                                   │
│  Event Service · Purchase Service · Check-in Service         │
│  SEP-10 Auth · Webhook Dispatch · Analytics                  │
├─────────────────────────────────────────────────────────────┤
│  SMART CONTRACT LAYER (Soroban)                              │
│  Ticket NFT (SEP-48) · POAP Badge · Resale Escrow           │
├─────────────────────────────────────────────────────────────┤
│  INDEXER LAYER                                               │
│  Payment Detector · Ownership Tracker · Attendance Recorder  │
├─────────────────────────────────────────────────────────────┤
│  STELLAR NETWORK                                             │
│  Freeze/Clawback · Claimable Balances · Muxed Accounts       │
│  Built-in DEX · USDC · SEP-24 Anchors                       │
└─────────────────────────────────────────────────────────────┘
```

### Soroban Contracts

**Ticket NFT Contract (`stellar_pass_ticket`)**
- Implements SEP-0048 (Soroban NFT Standard)
- `mint()` — create ticket NFT with metadata (event, tier, date, venue)
- `transfer()` — respects `is_transferable` flag and freeze status
- `freeze()` / `unfreeze()` — organizer controls ticket transferability
- `clawback()` — organizer reclaims ticket (refund, fraud)
- `mark_used()` — check-in flag, prevents double-use

**POAP Badge Contract (`stellar_pass_poap`)**
- Non-transferable NFT — no `transfer` or `approve` function exists
- `auth_required` flag set, organizer never authorizes transfers
- Soulbound by design — badge stays in your wallet forever
- Minted automatically upon verified check-in

**Resale Escrow Contract (`stellar_pass_escrow`)**
- Seller lists ticket → NFT held in escrow
- Price validated against organizer's resale cap
- Buyer pays → royalty split to organizer, remainder to seller
- Ticket transferred to buyer atomically

### Purchase Flow

```
Attendee → Frontend → Backend creates muxed account
→ Attendee sends USDC to muxed account
→ Indexer detects payment
→ Backend mints ticket NFT on Soroban
→ NFT transferred to attendee's wallet
→ Webhook fired to organizer
Total time: ~15 seconds
```

### Check-in Flow

```
Attendee presents QR code → Door staff scans
→ Backend verifies Ed25519 signature
→ Checks ticket ownership on-chain via indexer
→ Marks ticket as "used" on Soroban
→ Mints POAP badge to attendee's wallet
→ Returns green checkmark to scanner
Total time: ~10 seconds
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Widget | Web Components (Lit) — framework-agnostic |
| Scanner | PWA with Camera API — no app store needed |
| Backend | Node.js (Fastify) or Go (Fiber) |
| Database | PostgreSQL + Redis |
| Contracts | Rust on Soroban |
| Indexer | Custom Stellar Horizon watcher |
| Auth | SEP-10 challenge-response (wallet-based) |
| Hosting | Vercel (frontend) + Fly.io (backend) |

---

## Use Cases

### 1. Stellar Meridian Conference
- Sell passes as NFTs (early bird, standard, VIP tiers)
- Issue POAP badges for each day attended
- Airdrop after-party tickets via Claimable Balances
- View aggregate attendance analytics post-event
- **Showcase:** Stellar's own conference using Stellar-native ticketing

### 2. Community Meetups & Hackathons
- Free RSVP tickets (mint cost: $0.00001 per ticket)
- POAP badges as proof of participation
- Prize distribution linked to POAP ownership
- **Showcase:** Onboard new Stellar users through event attendance

### 3. Music Festivals & Large Venues
- 50,000 tickets minted at $0.50 total cost
- Asset freeze to revoke 200 scalped tickets
- Secondary market on Stellar DEX with 10% price cap
- Real-time attendance tracking via QR check-in
- **Showcase:** Scale that's uneconomical on any other chain

### 4. Virtual Events & Webinars
- Ticket purchase + POAP claim fully online
- POAP badge proves attendance for credentialing
- Access gating based on ticket ownership
- **Showcase:** Global reach, zero geographic constraints

### 5. DAO Governance Events
- Ticket = voting weight at in-person governance events
- POAP proves attendance at governance sessions
- On-chain record of who participated in decisions
- **Showcase:** Verifiable governance participation

---

## Grant Deliverables

### Phase 1 — Core Ticketing (Weeks 1-4)

| Deliverable | Description |
|---|---|
| Ticket NFT Soroban contract | SEP-0048 implementation with freeze/clawback/mark_used |
| Event creation API | Organizer creates events with tiers, pricing, supply |
| Purchase flow | Wallet connect → USDC/XLM payment → NFT ticket delivery |
| Hosted event pages | Public pages with event details, ticket tiers, purchase button |
| QR code generation | Ed25519-signed QR codes per ticket with TTL |
| Testnet deployment | Full flow on Stellar testnet |

### Phase 2 — POAP & Check-in (Weeks 5-8)

| Deliverable | Description |
|---|---|
| POAP badge Soroban contract | Non-transferable soulbound NFT |
| QR check-in system | Scan → verify signature → mark attendance → mint POAP |
| Attendee profile page | All tickets and POAP badges in one view |
| Social sharing | One-click share to Twitter/X |
| Organizer dashboard | Sales stats, attendance tracker, POAP claims |
| Mainnet deployment | Production launch |

### Phase 3 — Advanced Features (Weeks 9-12)

| Deliverable | Description |
|---|---|
| Resale escrow contract | Secondary market with price caps and royalty splits |
| Claimable Balance tickets | Airdrop to users without wallets |
| Fiat on-ramp | Credit card purchases via SEP-24 anchors |
| Analytics dashboard | Attendance rates, geographic data, engagement metrics |
| Event reputation system | Organizer ratings from past events |
| Mobile check-in PWA | Installable scanner app for venue staff |

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Events created | 200+ |
| Tickets minted | 10,000+ |
| POAPs claimed | 5,000+ |
| Active organizers | 50+ |
| Secondary market trades | 500+ |
| New wallets onboarded | 3,000+ |
| Stellar transactions generated | 50,000+ |

---

## Sustainability

### During Grant Period
- Free for all organizers and attendees
- Focus on adoption: Stellar community events first (Meridian, meetups, SCF demo days)
- Open-source core contracts and indexer

### Post-Grant Revenue

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0/mo | 1 event/month, 100 tickets, basic POAP, hosted page |
| **Pro** | $49/mo | Unlimited events, 10K tickets/event, custom branding, analytics |
| **Enterprise** | Custom | White-label, API access, dedicated support, SLA |

**Per-ticket fee:** $0.10 per paid ticket on free tier. Free tickets and POAPs always free.
**Compared to:** Ticketmaster ($5-15/ticket), Eventbrite ($1-8/ticket), GET Protocol (~$0.30/ticket).

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Soroban ecosystem immaturity** | Use native asset issuance for simple tickets. Reserve Soroban for advanced features. |
| **Low organizer adoption** | Target Stellar community first. Free tier. SCF partnership for promotion. |
| **POAP competition** | POAP doesn't support Stellar. Build the standard first. |
| **Scalping arms race** | Freeze/clawback is a unique advantage no other chain offers. |
| **QR code spoofing** | Ed25519-signed payloads with 15-minute TTL. Real-time ownership verification. |
| **Low secondary market liquidity** | Built-in DEX provides baseline. Partner with DEX aggregators. |

---

## Team & Ask

**Ask:** $50,000 - $75,000 in XLM from the Stellar Community Fund

**Use of funds:**
- 50% — Development (smart contracts, backend, frontend, indexer)
- 20% — Security audit (Soroban contracts)
- 15% — Community adoption (onboard 10 Stellar events in first 3 months)
- 15% — Documentation, support, infrastructure

**Why us:**
- Deep understanding of Stellar's native primitives (not just "build on Stellar" but "build with Stellar")
- Clear product vision with measurable adoption targets
- First-mover in an uncontested vertical on Stellar
- Composable with every existing Stellar project (wallets, anchors, SEPs)

---

## The Ask for SCF Reviewers

Stellar has the best payment infrastructure in crypto — sub-5-second settlement, $0.00001 fees, native asset freeze/clawback, Claimable Balances, built-in DEX, and mature fiat on/off ramps via SEPs and anchors. But the ecosystem has zero event ticketing and zero proof-of-attendance infrastructure.

Stellar Pass fills this gap with a product that showcases Stellar's unique primitives in a consumer-facing application. Every feature — freeze/clawback for anti-fraud, Claimable Balances for wallet-less onboarding, built-in DEX for secondary markets, POAP badges for attendance proof — maps directly to a Stellar-native capability that no other chain offers.

This isn't "blockchain ticketing on Stellar." It's "ticketing that can only work on Stellar."

We're building the infrastructure for every future Stellar event — Meridian, community meetups, hackathons, and beyond. And we're creating a product that brings new users into the ecosystem through the most natural entry point: attending an event.
