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

Verify installation:
```bash
cargo odra --version
```

## Step 2: Build the Smart Contracts

```bash
cd contracts
cargo odra build -b casper
```

This will compile the Odra contracts to Wasm format for Casper.

## Step 3: Create Secret Key File

Create a file `contracts/secret_key.pem` with your private key:

```bash
# This file is in .gitignore - never commit it!
# Format: base64 encoded Ed25519 private key
```

## Step 4: Deploy to Testnet

```bash
cargo odra deploy \
  -b casper \
  -n casper-test \
  --secret-key ./secret_key.pem
```

Or using environment variable:
```bash
export ODRA_CASPER_LIVENET_SECRET_KEY_PATH=./secret_key.pem
cargo odra deploy -b casper -n casper-test
```

## Step 5: Save Contract Hash

After successful deployment, you'll see output like:
```
Contract deployed successfully!
Contract hash: hash-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Save this hash!** You'll need it for configuration.

### ✅ Deployed Contract Information

**Status:** Successfully deployed to Casper Testnet!

- **Package Hash:** `hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df`
- **Deploy Hash:** `697df7c33b8495b2db4c81f3ecf7faeab2fd65e9d2986beac97e0e496ea325f6`
- **Explorer:** https://testnet.cspr.live/deploy/697df7c33b8495b2db4c81f3ecf7faeab2fd65e9d2986beac97e0e496ea325f6
- **Account:** https://testnet.cspr.live/account/01854e96435611f12bdf9fe5136b338122d1b53e83dd04261a52966edc1099166f
- **Cost:** ~321.44 CSPR
- **Deployed:** November 28, 2025

## Step 6: Configure Environment Variables

### Frontend (.env)
```env
VITE_CONTRACT_HASH=hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df
VITE_CASPER_NETWORK=casper-test
VITE_CASPER_RPC_URL=https://rpc.testnet.casperlabs.io/rpc
VITE_API_URL=http://localhost:3001/api
```

### Backend (.env)
```env
CONTRACT_HASH=hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df
CSPR_CLOUD_STREAMING_URL=wss://streaming.testnet.cspr.cloud
PORT=3001
DATABASE_PATH=./data/optimizer.db
```

## Step 7: Verify Deployment

Check your contract on Casper Explorer:
```
https://testnet.cspr.live/contract/[YOUR_CONTRACT_HASH]
```

## Step 8: Test Contract Calls

You can test contract calls using cargo-odra:

```bash
# Get TVL
cargo odra call -b casper -n casper-test \
  --contract-hash hash-xxxxx \
  --entry-point get_tvl

# Get owner
cargo odra call -b casper -n casper-test \
  --contract-hash hash-xxxxx \
  --entry-point get_owner
```

## Deployment Costs

Approximate gas costs on testnet:
- Contract deployment: ~50-100 CSPR
- Contract initialization: ~10 CSPR
- Deposit transaction: ~5 CSPR
- Withdrawal transaction: ~7 CSPR

## Troubleshooting

### "Insufficient funds"
- Check your balance: https://testnet.cspr.live/account/[YOUR_ACCOUNT_HASH]
- Get more testnet CSPR: https://testnet.cspr.live/tools/faucet

### "Contract already exists"
- This is normal if redeploying
- Each deployment creates a new contract instance
- Update the contract hash in your .env files

### "Invalid key format"
- Ensure your secret_key.pem is in the correct format
- Try regenerating from your wallet

## Security Notes

- Never commit `secret_key.pem` to git (it's in .gitignore)
- For mainnet, use a hardware wallet or secure key management
- Test thoroughly on testnet before mainnet deployment

## Next Steps

After deployment:
1. Update .env files with contract hash
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Test deposit/withdraw functionality
5. Monitor transactions on Casper Explorer
