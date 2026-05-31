#!/usr/bin/env bash
set -euo pipefail

# Stellar Pass - Example Invoke Commands
# Usage: source .env.testnet && ./scripts/invoke.sh
#
# This script demonstrates how to call each contract function.
# Edit the variables below with your actual contract IDs and addresses.

# ---------------------------------------------------------------------------
# Configuration — set these before running
# ---------------------------------------------------------------------------
: "${TICKET_CONTRACT_ID:?Set TICKET_CONTRACT_ID}"
: "${POAP_CONTRACT_ID:?Set POAP_CONTRACT_ID}"
: "${ESCROW_CONTRACT_ID:?Set ESCROW_CONTRACT_ID}"
: "${ADMIN_ADDRESS:?Set ADMIN_ADDRESS}"
: "${NETWORK:=testnet}"
: "${RPC_URL:=https://soroban-testnet.stellar.org}"
: "${NETWORK_PASSPHRASE:=Test SDF Network ; September 2015}"

IDENTITY="${SOROBAN_IDENTITY:-default}"
ALICE="${ALICE_ADDRESS:-$ADMIN_ADDRESS}"
BOB="${BOB_ADDRESS:-$ADMIN_ADDRESS}"

INVOKE="soroban contract invoke --source-account $IDENTITY --network $NETWORK --rpc-url $RPC_URL --network-passphrase $NETWORK_PASSPHRASE"

echo "=== Ticket Contract Examples ==="
echo ""

echo "--- name ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- name

echo "--- symbol ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- symbol

echo "--- mint ---"
# Mint a ticket to Alice with ID 1
$INVOKE --id "$TICKET_CONTRACT_ID" -- mint \
    --to "$ALICE" \
    --token_id 1 \
    --metadata '{
        "event_id": "4142434445464748",
        "tier": "VIP",
        "event_date": 1700000000,
        "venue": "Madison Square Garden",
        "image_url": "https://example.com/ticket.png",
        "is_transferable": true,
        "resale_price_cap": 1000000000,
        "status": {"tag": "Active"}
    }'

echo "--- owner_of ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- owner_of --token_id 1

echo "--- balance ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- balance --owner "$ALICE"

echo "--- get_metadata ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- get_metadata --ticket_id 1

echo "--- get_event_id ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- get_event_id --ticket_id 1

echo "--- is_transferable ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- is_transferable --ticket_id 1

echo "--- get_resale_cap ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- get_resale_cap --ticket_id 1

echo "--- freeze ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- freeze --ticket_id 1

echo "--- unfreeze ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- unfreeze --ticket_id 1

echo "--- mark_used ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- mark_used --ticket_id 1

echo "--- transfer ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- transfer \
    --from "$ALICE" \
    --to "$BOB" \
    --token_id 1

echo "--- clawback ---"
$INVOKE --id "$TICKET_CONTRACT_ID" -- clawback --ticket_id 1

echo ""
echo "=== POAP Contract Examples ==="
echo ""

echo "--- mint ---"
$INVOKE --id "$POAP_CONTRACT_ID" -- mint \
    --to "$ALICE" \
    --badge_id 1 \
    --metadata '{
        "event_id": "41424344",
        "event_name": "Stellar Summit 2025",
        "event_date": 1700000000,
        "attendee": "'"$ALICE"'",
        "badge_image_url": "https://ipfs.io/ipfs/QmBadge123",
        "minted_at": 1700000100
    }'

echo "--- owner_of ---"
$INVOKE --id "$POAP_CONTRACT_ID" -- owner_of --badge_id 1

echo "--- balance ---"
$INVOKE --id "$POAP_CONTRACT_ID" -- balance --owner "$ALICE"

echo "--- get_metadata ---"
$INVOKE --id "$POAP_CONTRACT_ID" -- get_metadata --badge_id 1

echo "--- badges_of ---"
$INVOKE --id "$POAP_CONTRACT_ID" -- badges_of --owner "$ALICE"

echo ""
echo "=== Escrow Contract Examples ==="
echo ""

# Assumes you have a token contract for payments
TOKEN_CONTRACT="${TOKEN_CONTRACT_ID:-}"

if [ -n "$TOKEN_CONTRACT" ]; then
    echo "--- create_listing ---"
    $INVOKE --id "$ESCROW_CONTRACT_ID" -- create_listing \
        --seller "$ALICE" \
        --ticket_contract "$TICKET_CONTRACT_ID" \
        --ticket_id 1 \
        --ask_price 500000000 \
        --currency "$TOKEN_CONTRACT" \
        --royalty_bps 500

    echo "--- get_listing ---"
    $INVOKE --id "$ESCROW_CONTRACT_ID" -- get_listing --listing_id 1

    echo "--- get_active_listings ---"
    $INVOKE --id "$ESCROW_CONTRACT_ID" -- get_active_listings \
        --event_id "4142434445464748"

    echo "--- buy ---"
    $INVOKE --id "$ESCROW_CONTRACT_ID" -- buy \
        --buyer "$BOB" \
        --listing_id 1

    echo "--- cancel_listing (example) ---"
    # $INVOKE --id "$ESCROW_CONTRACT_ID" -- cancel_listing \
    #     --seller "$ALICE" \
    #     --listing_id 2
else
    echo "Skipping escrow examples — set TOKEN_CONTRACT_ID to run them"
fi

echo ""
echo "Done!"
