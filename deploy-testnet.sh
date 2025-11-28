#!/bin/bash

# CasperNews Deployment Script
# YieldOptimizer Contract - Odra Framework

echo "🚀 Deploying CasperNews YieldOptimizer"
echo "======================================="

# Configuration
NODE_ADDRESS="https://rpc.testnet.casperlabs.io:7777"
CHAIN_NAME="casper-test"
CONTRACT_WASM="contracts/wasm/YieldOptimizer.wasm"
SECRET_KEY="contracts/secret_key.pem"
PAYMENT_AMOUNT="200000000000"  # 200 CSPR
GAS_PRICE_TOLERANCE=5
TTL="30min"

echo ""
echo "📋 Deployment Configuration:"
echo "  Contract: $CONTRACT_WASM"
echo "  Network: Casper Testnet"
echo "  Payment: 200 CSPR"
echo ""

# Check if WASM exists
if [ ! -f "$CONTRACT_WASM" ]; then
    echo "❌ Error: Contract WASM not found at $CONTRACT_WASM"
    echo "Please run: cd contracts && cargo odra build"
    exit 1
fi

# Get WASM size
WASM_SIZE=$(du -h "$CONTRACT_WASM" | cut -f1)
echo "✅ Contract WASM found (Size: $WASM_SIZE)"
echo ""

# Check if secret key exists
if [ ! -f "$SECRET_KEY" ]; then
    echo "❌ Error: Secret key not found at $SECRET_KEY"
    echo "Please create it or adjust SECRET_KEY path in this script"
    exit 1
fi

echo "✅ Secret key found"
echo ""

# Deploy
echo "🔄 Deploying contract to testnet..."
echo ""

casper-client put-transaction session \
  --node-address "$NODE_ADDRESS" \
  --secret-key "$SECRET_KEY" \
  --chain-name "$CHAIN_NAME" \
  --wasm-path "$CONTRACT_WASM" \
  --session-arg "management_fee_bp:u32='100'" \
  --install-upgrade \
  --payment-amount "$PAYMENT_AMOUNT" \
  --pricing-mode fixed \
  --gas-price-tolerance "$GAS_PRICE_TOLERANCE" \
  --ttl "$TTL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment transaction submitted successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Wait ~60-120 seconds for deployment to finalize"
    echo "  2. Check transaction on: https://testnet.cspr.live"
    echo "  3. Get contract hash from the deploy"
    echo "  4. Update frontend with contract hash"
    echo ""
else
    echo ""
    echo "❌ Deployment failed! Check the error message above."
    exit 1
fi
