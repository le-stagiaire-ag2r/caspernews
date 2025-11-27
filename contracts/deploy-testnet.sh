#!/bin/bash

# YieldOptimizer Deployment Script for Casper Testnet
# Following the same pattern as Casper-projet deploy-v5.sh

echo "🚀 YieldOptimizer Deployment to Casper Testnet"
echo "================================================"
echo ""

# Configuration
NODE_ADDRESS="https://node.testnet.casper.network:7777"
CHAIN_NAME="casper-test"
SECRET_KEY="./secret_key.pem"
WASM_PATH="./wasm/YieldOptimizer.wasm"
PAYMENT_AMOUNT="200000000000"  # 200 CSPR
GAS_TOLERANCE="5"
TTL="30min"

# Validate WASM file exists
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ Error: WASM file not found at $WASM_PATH"
    echo "   Please run 'cargo odra build' first"
    exit 1
fi

# Show file info
WASM_SIZE=$(ls -lh "$WASM_PATH" | awk '{print $5}')
echo "📦 Contract: $WASM_PATH"
echo "📏 Size: $WASM_SIZE"
echo ""

# Deploy
echo "🔄 Deploying contract to testnet..."
echo ""

casper-client put-transaction session \
  --node-address "$NODE_ADDRESS" \
  --chain-name "$CHAIN_NAME" \
  --secret-key "$SECRET_KEY" \
  --wasm-path "$WASM_PATH" \
  --session-arg "management_fee_bp:u32='100'" \
  --pricing-mode fixed \
  --gas-price-tolerance "$GAS_TOLERANCE" \
  --ttl "$TTL" \
  --install-upgrade \
  --payment-amount "$PAYMENT_AMOUNT"

echo ""
echo "✅ Deployment transaction submitted!"
echo ""
echo "⏳ Wait ~60 seconds for finalization"
echo "🔍 Check status at: https://testnet.cspr.live/"
echo ""
echo "📝 After deployment, get the contract hash from the explorer"
echo "   and update your .env files"
