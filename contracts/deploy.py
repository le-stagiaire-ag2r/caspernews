#!/usr/bin/env python3
"""Deploy YieldOptimizer contract to Casper Testnet"""

import os
import json
import time
import base64
from pathlib import Path

try:
    from pycspr import NodeClient, NodeRpcClient
    from pycspr.crypto import KeyAlgorithm
    from pycspr.types import Deploy, DeployParameters, PublicKey, PrivateKey
except ImportError:
    print("❌ pycspr not installed. Install with: pip3 install pycspr")
    exit(1)

# Configuration
NODE_URL = "https://rpc.testnet.casperlabs.io"
NETWORK_NAME = "casper-test"
PAYMENT_AMOUNT = 200_000_000_000  # 200 CSPR
MANAGEMENT_FEE_BP = 100  # 1%

# Load private key from PEM
pem_path = Path(__file__).parent / "secret_key.pem"
with open(pem_path, 'r') as f:
    pem_content = f.read()

# Parse PEM - extract base64
pem_lines = pem_content.strip().split('\n')
base64_content = ''.join(pem_lines[1:-1])
raw_key = base64.b64decode(base64_content)

# Ed25519 private key is at offset 16, 32 bytes (PKCS#8 format)
private_key_bytes = raw_key[16:48]

print("📋 Deploying YieldOptimizer to Casper Testnet...")
print(f"   Node: {NODE_URL}")
print(f"   Network: {NETWORK_NAME}")

# Load WASM
wasm_path = Path(__file__).parent / "wasm" / "YieldOptimizer.wasm"
with open(wasm_path, 'rb') as f:
    wasm_bytes = f.read()

print(f"   WASM Size: {len(wasm_bytes)} bytes")

# Create keypair
private_key = PrivateKey.from_bytes(private_key_bytes, KeyAlgorithm.ED25519)
public_key = private_key.to_public_key()

print(f"   Public Key: {public_key.to_hex()}")
print()

# Create deploy
client = NodeRpcClient(NODE_URL)

# Deploy parameters
params = DeployParameters(
    account=public_key,
    chain_name=NETWORK_NAME,
    gas_price=1,
    ttl_ms=1800000,  # 30 minutes
    payment_amount=PAYMENT_AMOUNT
)

try:
    # Create module bytes deploy
    deploy = Deploy.new_module_bytes(
        params=params,
        module_bytes=wasm_bytes,
        runtime_args={
            "management_fee_bp": ("u32", MANAGEMENT_FEE_BP)
        }
    )

    # Sign
    deploy.approve(private_key)

    # Send
    deploy_hash = client.send_deploy(deploy)

    print("✅ Deploy submitted successfully!")
    print(f"   Deploy Hash: {deploy_hash.hex()}")
    print(f"   Explorer: https://testnet.cspr.live/deploy/{deploy_hash.hex()}")
    print()
    print("⏳ Deployment initiated. Check the explorer for status.")
    print("   The contract should be deployed in 1-2 minutes.")
    print()
    print("📝 After deployment completes:")
    print("   1. Visit the explorer link above")
    print("   2. Find the contract hash in the execution results")
    print("   3. Update your .env files with the contract hash")

except Exception as e:
    print(f"❌ Deployment failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
