# 🚀 CasperNews Deployment Guide

## Quick Deploy (2 minutes)

### Prerequisites
- `casper-client` v5.0+ installed
- Secret key file at `contracts/secret_key.pem`
- At least 200 CSPR in your testnet account

### Deploy Steps

```bash
# 1. From project root
./deploy-testnet.sh
```

That's it! The script will:
- ✅ Check WASM exists (311KB)
- ✅ Verify secret key
- 🚀 Deploy to Casper testnet
- 📋 Give you the transaction hash

### Get Transaction Hash

After deployment, copy the transaction hash and check status:

```bash
https://testnet.cspr.live/deploy/YOUR_HASH
```

Wait ~60-120 seconds for execution.

---

## Manual Deployment (if script fails)

```bash
casper-client put-transaction session \
  --node-address https://rpc.testnet.casperlabs.io:7777 \
  --secret-key contracts/secret_key.pem \
  --chain-name casper-test \
  --wasm-path contracts/wasm/YieldOptimizer.wasm \
  --session-arg "management_fee_bp:u32='100'" \
  --install-upgrade \
  --payment-amount 200000000000 \
  --pricing-mode fixed \
  --gas-price-tolerance 5 \
  --ttl 30min
```

---

## Installing casper-client

### Linux / WSL / macOS

```bash
cargo install casper-client
```

### Windows (PowerShell)

Download from: https://github.com/casper-network/casper-client-rs/releases

Or use WSL with the Linux instructions above.

### Docker Alternative

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/casper-network/casper-client-rs:latest \
  put-transaction session \
  --node-address https://rpc.testnet.casperlabs.io:7777 \
  --secret-key /workspace/contracts/secret_key.pem \
  --chain-name casper-test \
  --wasm-path /workspace/contracts/wasm/YieldOptimizer.wasm \
  --session-arg "management_fee_bp:u32='100'" \
  --install-upgrade \
  --payment-amount 200000000000 \
  --pricing-mode fixed
```

---

## Troubleshooting

### "casper-client: command not found"
Install it: `cargo install casper-client`

### "secret_key.pem not found"
Create or copy your key to `contracts/secret_key.pem`

### "WASM not found"
Build it: `cd contracts && cargo odra build`

### "insufficient funds"
Get testnet CSPR from faucet: https://testnet.cspr.live/tools/faucet

---

## After Deployment

1. Get the contract hash from cspr.live
2. Update `frontend/src/config.js` with the contract hash
3. Deploy frontend to get your dApp live!

✅ You're ready for the hackathon! 🏆
