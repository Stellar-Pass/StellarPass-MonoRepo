#!/usr/bin/env bash
set -euo pipefail

# Stellar Pass - Build & Deploy Contracts to Stellar Testnet
# Usage: ./scripts/deploy.sh [--network testnet|mainnet]

NETWORK="${1:-testnet}"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

if [ "$NETWORK" = "mainnet" ]; then
    RPC_URL="https://soroban.stellar.org"
    NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
fi

# Ensure soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "Error: soroban CLI not found. Install with:"
    echo "  cargo install --locked soroban-cli"
    exit 1
fi

# Check for identity
IDENTITY="${SOROBAN_IDENTITY:-default}"
echo "Using identity: $IDENTITY"
ADMIN_ADDRESS=$(soroban keys address "$IDENTITY")
echo "Admin address: $ADMIN_ADDRESS"

# Build all contracts
echo ""
echo "=== Building contracts ==="
soroban contract build

# Optimize (produces .optimized.wasm)
echo ""
echo "=== Optimizing contracts ==="
for contract in ticket poap escrow; do
    WASM="target/wasm32-unknown-unknown/release/stellar_pass_${contract}.wasm"
    OPTIMIZED="target/wasm32-unknown-unknown/release/stellar_pass_${contract}.optimized.wasm"
    if [ -f "$WASM" ]; then
        soroban contract optimize --wasm "$WASM" --wasm-out "$OPTIMIZED"
        echo "  Optimized: stellar_pass_${contract}"
    fi
done

# Deploy each contract
echo ""
echo "=== Deploying contracts to $NETWORK ==="

declare -A CONTRACT_IDS

for contract in ticket poap escrow; do
    OPTIMIZED="target/wasm32-unknown-unknown/release/stellar_pass_${contract}.optimized.wasm"
    WASM="target/wasm32-unknown-unknown/release/stellar_pass_${contract}.wasm"

    # Use optimized if available, otherwise fallback to regular
    DEPLOY_WASM="$OPTIMIZED"
    if [ ! -f "$DEPLOY_WASM" ]; then
        DEPLOY_WASM="$WASM"
    fi

    if [ ! -f "$DEPLOY_WASM" ]; then
        echo "Warning: WASM not found for $contract, skipping"
        continue
    fi

    echo "Deploying stellar_pass_${contract}..."
    CONTRACT_ID=$(soroban contract deploy \
        --wasm "$DEPLOY_WASM" \
        --source-account "$IDENTITY" \
        --network "$NETWORK" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE")

    CONTRACT_IDS[$contract]="$CONTRACT_ID"
    echo "  Contract ID: $CONTRACT_ID"
done

# Initialize contracts
echo ""
echo "=== Initializing contracts ==="

# Initialize Ticket contract
if [ -n "${CONTRACT_IDS[ticket]:-}" ]; then
    echo "Initializing ticket contract..."
    soroban contract invoke \
        --id "${CONTRACT_IDS[ticket]}" \
        --source-account "$IDENTITY" \
        --network "$NETWORK" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- initialize \
        --admin "$ADMIN_ADDRESS" \
        --name "Stellar Pass Ticket" \
        --symbol "SPT"
    echo "  Ticket contract initialized"
fi

# Initialize POAP contract
if [ -n "${CONTRACT_IDS[poap]:-}" ]; then
    echo "Initializing POAP contract..."
    # event_id is a 4-byte hex
    soroban contract invoke \
        --id "${CONTRACT_IDS[poap]}" \
        --source-account "$IDENTITY" \
        --network "$NETWORK" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- initialize \
        --admin "$ADMIN_ADDRESS" \
        --event_id "41424344"  # "ABCD" in hex
    echo "  POAP contract initialized"
fi

# Initialize Escrow contract
if [ -n "${CONTRACT_IDS[escrow]:-}" ]; then
    echo "Initializing escrow contract..."
    soroban contract invoke \
        --id "${CONTRACT_IDS[escrow]}" \
        --source-account "$IDENTITY" \
        --network "$NETWORK" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- initialize \
        --admin "$ADMIN_ADDRESS"
    echo "  Escrow contract initialized"
fi

# Save deployment info
echo ""
echo "=== Deployment Summary ==="
echo "Network: $NETWORK"
echo "Admin:   $ADMIN_ADDRESS"
for contract in ticket poap escrow; do
    if [ -n "${CONTRACT_IDS[$contract]:-}" ]; then
        echo "  $contract: ${CONTRACT_IDS[$contract]}"
    fi
done

# Write to .env file
ENV_FILE=".env.${NETWORK}"
cat > "$ENV_FILE" << EOF
# Stellar Pass Deployment - $NETWORK
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
NETWORK=$NETWORK
RPC_URL=$RPC_URL
NETWORK_PASSPHRASE=$NETWORK_PASSPHRASE
ADMIN_ADDRESS=$ADMIN_ADDRESS
TICKET_CONTRACT_ID=${CONTRACT_IDS[ticket]:-}
POAP_CONTRACT_ID=${CONTRACT_IDS[poap]:-}
ESCROW_CONTRACT_ID=${CONTRACT_IDS[escrow]:-}
EOF

echo ""
echo "Deployment info saved to $ENV_FILE"
echo "Done!"
