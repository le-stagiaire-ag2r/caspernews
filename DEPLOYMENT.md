# Deployment Guide - Casper DeFi Yield Optimizer

This guide explains how to deploy the smart contracts to Casper Testnet.

## Prerequisites

- Rust and Cargo installed
- cargo-odra installed: `cargo install cargo-odra`
- Casper wallet with testnet CSPR (minimum ~100 CSPR for deployment)
- Private key in PEM format

## Account Information

**Testnet Account:**
- Public Key: `01854e96435611f12bdf9fe5136b338122d1b53e83dd04261a52966edc1099166f`
- Account Hash: `830528a2e4739d81608c9d8afac1241eb04e7ef9232653485c76eb74762bb639`
- Balance: 799 CSPR (testnet)

## Step 1: Install cargo-odra

```bash
cargo install cargo-odra
```

## Step 2: Build Contracts

From the `contracts/` directory:

```bash
cargo odra build
```

This will compile the smart contracts to WebAssembly format.

## Step 3: Deploy to Testnet

### Option A: Using Node.js Script (Recommended)

```bash
cd contracts
npm install
node deploy-final.js
```

### Option B: Using casper-client CLI

If you have `casper-client` installed:

```bash
casper-client put-deploy \
  --node-address https://rpc.testnet.casperlabs.io \
  --chain-name casper-test \
  --secret-key ./contracts/secret_key.pem \
  --payment-amount 200000000000 \
  --session-path ./contracts/wasm/YieldOptimizer.wasm \
  --session-arg "management_fee_bp:u32='100'"
```

### Option C: Manual Deployment via Explorer

1. Visit https://testnet.cspr.live/deploy-contract
2. Upload `contracts/wasm/YieldOptimizer.wasm`
3. Set payment amount: 200 CSPR
4. Add init argument: `management_fee_bp` (U32) = 100
5. Sign with your wallet

The deployment will return a **deploy hash**. Save it!

## Step 4: Configure Environment Variables

After deployment, update the environment variables:

**Frontend** (`frontend/.env`):
```
VITE_CONTRACT_HASH=hash-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_CASPER_NETWORK=casper-test
VITE_RPC_URL=https://rpc.testnet.casperlabs.io
```

**Backend** (`backend/.env`):
```
CONTRACT_HASH=hash-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CSPR_CLOUD_WS_URL=wss://api.testnet.casperlabs.io/events
```

## Step 5: Test Deployment

Test the deployment by calling a read-only method:

```bash
casper-client query-global-state \
  --node-address https://rpc.testnet.casperlabs.io \
  --state-root-hash $(casper-client get-state-root-hash --node-address https://rpc.testnet.casperlabs.io | jq -r '.result.state_root_hash') \
  --key hash-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Troubleshooting

### Insufficient Balance

If you get an "insufficient balance" error, ensure you have at least 100 CSPR testnet tokens.

### Invalid Key Format

Ensure your `secret_key.pem` is in the correct PEM format:

```
-----BEGIN PRIVATE KEY-----
[base64 encoded key]
-----END PRIVATE KEY-----
```

### Network Issues

If deployment times out, try:
1. Check your internet connection
2. Verify the RPC endpoint is accessible: `curl https://rpc.testnet.casperlabs.io/rpc`
3. Wait a few minutes and retry

## Verify on Block Explorer

After deployment, you can view your contract on the testnet block explorer:

https://testnet.cspr.live/contract/[your-contract-hash]

## Gas Costs

Typical gas costs on Casper Testnet:
- Contract deployment: 50-100 CSPR
- Deposit transaction: 5 CSPR
- Withdraw transaction: 7 CSPR
- Rebalance: 10-15 CSPR
