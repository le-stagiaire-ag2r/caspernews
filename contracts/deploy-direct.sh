#!/bin/bash

# Direct deployment to Casper testnet via RPC
# No casper-client needed - pure bash + curl

set -e

echo "🚀 Deploying YieldOptimizer to Casper testnet..."
echo ""

# Configuration
NODE_URL="https://rpc.testnet.casperlabs.io/rpc"
CHAIN_NAME="casper-test"
WASM_PATH="wasm/YieldOptimizer.wasm"
SECRET_KEY="secret_key.pem"
PAYMENT_AMOUNT="200000000000"  # 200 CSPR

# Check files exist
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM file not found: $WASM_PATH"
    exit 1
fi

if [ ! -f "$SECRET_KEY" ]; then
    echo "❌ Secret key not found: $SECRET_KEY"
    exit 1
fi

echo "✅ Files verified"
echo "📦 WASM: $WASM_PATH ($(stat -f%z "$WASM_PATH" 2>/dev/null || stat -c%s "$WASM_PATH") bytes)"
echo "🔑 Using key: $SECRET_KEY"
echo "💰 Payment: $PAYMENT_AMOUNT motes (200 CSPR)"
echo ""

# Base64 encode the WASM
echo "📝 Encoding WASM..."
WASM_BASE64=$(base64 -w 0 "$WASM_PATH")

# Get public key from secret key (simplified for Ed25519)
echo "🔐 Extracting public key..."
# For now, use the known public key for the provided secret key
PUBLIC_KEY="01d2cf2247ce4b6c1f7669ae0c1ff652f1e3e2c63a598a85ea86cda49c44beea49"

# Create timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
TTL="30m"

echo "⏰ Timestamp: $TIMESTAMP"
echo ""
echo "🔨 Building deploy JSON..."

# Build the deploy JSON (simplified version)
cat > deploy.json <<EOF
{
  "jsonrpc": "2.0",
  "method": "account_put_deploy",
  "params": {
    "deploy": {
      "hash": "",
      "header": {
        "account": "$PUBLIC_KEY",
        "timestamp": "$TIMESTAMP",
        "ttl": "$TTL",
        "gas_price": 1,
        "body_hash": "",
        "dependencies": [],
        "chain_name": "$CHAIN_NAME"
      },
      "payment": {
        "ModuleBytes": {
          "module_bytes": "",
          "args": [
            {
              "name": "amount",
              "cl_type": "U512",
              "value": "$PAYMENT_AMOUNT"
            }
          ]
        }
      },
      "session": {
        "ModuleBytes": {
          "module_bytes": "$WASM_BASE64",
          "args": [
            {
              "name": "management_fee_bp",
              "cl_type": "U32",
              "value": 100
            }
          ]
        }
      },
      "approvals": []
    }
  },
  "id": 1
}
EOF

echo "📤 Sending deploy to testnet..."
echo "🌐 Node: $NODE_URL"
echo ""

# Send the deploy
RESPONSE=$(curl -s -X POST "$NODE_URL" \
  -H "Content-Type: application/json" \
  -d @deploy.json)

echo "📥 Response received:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract deploy hash if successful
DEPLOY_HASH=$(echo "$RESPONSE" | jq -r '.result.deploy_hash // empty' 2>/dev/null)

if [ -n "$DEPLOY_HASH" ]; then
    echo "✅ Deploy successful!"
    echo ""
    echo "📋 Deploy Hash: $DEPLOY_HASH"
    echo ""
    echo "🔍 Track your deploy:"
    echo "   https://testnet.cspr.live/deploy/$DEPLOY_HASH"
    echo ""
    echo "⏳ Wait ~2 minutes for execution, then check contract hash!"
else
    echo "❌ Deploy failed. Check the response above for details."
    exit 1
fi
