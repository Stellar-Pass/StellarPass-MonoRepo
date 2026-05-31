# Stellar Pass — Soroban Smart Contracts

NFT event ticketing platform contracts for the Stellar network using Soroban.

## Contracts

| Contract | Description |
|---|---|
| `stellar_pass_ticket` | SEP-0048 compliant NFT ticket with freeze/clawback/burn |
| `stellar_pass_poap` | Soulbound (non-transferable) attendance badge |
| `stellar_pass_escrow` | Resale marketplace with price cap enforcement and royalties |

## Prerequisites

- Rust 1.91+ (`rustup update stable`)
- Soroban CLI: `cargo install --locked soroban-cli`
- Stellar account with testnet funds: https://stellar.org/laboratory

## Build

```bash
# Build all contracts (debug)
cargo build --target wasm32-unknown-unknown --release

# Or use soroban CLI (includes optimization)
soroban contract build

# Optimize
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/stellar_pass_ticket.wasm \
  --wasm-out target/wasm32-unknown-unknown/release/stellar_pass_ticket.optimized.wasm
```

## Test

```bash
cargo test
```

## Deploy

### Quick deploy (all contracts to testnet)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh testnet
```

### Manual deploy

```bash
# Deploy ticket contract
TICKET_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_pass_ticket.optimized.wasm \
  --source-account default \
  --network testnet)

# Initialize
soroban contract invoke --id "$TICKET_ID" --source-account default --network testnet \
  -- initialize \
  --admin "$(soroban keys address default)" \
  --name "Stellar Pass Ticket" \
  --symbol "SPT"
```

## Invoke

See `scripts/invoke.sh` for complete examples of every contract function.

### Mint a ticket

```bash
soroban contract invoke --id "$TICKET_ID" --source-account default --network testnet \
  -- mint \
  --to "$ALICE_ADDRESS" \
  --token_id 1 \
  --metadata '{"event_id":"4142434445464748","tier":"VIP","event_date":1700000000,"venue":"MSG","image_url":"https://example.com/t.png","is_transferable":true,"resale_price_cap":1000000000,"status":{"tag":"Active"}}'
```

### Transfer a ticket

```bash
soroban contract invoke --id "$TICKET_ID" --source-account default --network testnet \
  -- transfer --from "$ALICE" --to "$BOB" --token_id 1
```

### Create a resale listing

```bash
soroban contract invoke --id "$ESCROW_ID" --source-account default --network testnet \
  -- create_listing \
  --seller "$ALICE" \
  --ticket_contract "$TICKET_ID" \
  --ticket_id 1 \
  --ask_price 500000000 \
  --currency "$USDC_CONTRACT" \
  --royalty_bps 500
```

## Architecture

See `stellar-pass-technical-architecture.md` for the full design specification.

```
Ticket Contract     POAP Contract       Escrow Contract
     |                   |                     |
     |  mint/transfer    |  mint (soulbound)   |  create_listing
     |  freeze/unfreeze  |  badges_of          |  buy (royalty split)
     |  clawback/burn    |                     |  cancel_listing
     |                   |                     |
     +-------------------+---------------------+
                       Stellar Network
```

## Storage Layout

**Ticket Contract:**
- Instance: admin, name, symbol, minted_count
- Persistent: ticket_{id}, owner_{id}, balance_{addr}, approval_{id}

**POAP Contract:**
- Instance: admin, event_id, minted_count
- Persistent: badge_{id}, owner_{id}, balance_{addr}, badges_{addr}

**Escrow Contract:**
- Instance: admin, listing_count
- Persistent: listing_{id}, listings_by_event_{event_id}
