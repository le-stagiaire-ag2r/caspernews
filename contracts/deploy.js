const fs = require('fs');
const path = require('path');
const casperSDK = require('casper-js-sdk');
const { CasperClient, CLPublicKey, DeployUtil } = casperSDK;

// Configuration
const NODE_URL = 'https://rpc.testnet.casperlabs.io';
const NETWORK_NAME = 'casper-test';
const PAYMENT_AMOUNT = '100000000000'; // 100 CSPR
const GAS_PRICE = 1;
const TTL = 1800000; // 30 minutes

// Load secret key from PEM file
const secretKeyPath = path.join(__dirname, 'secret_key.pem');
const pemContent = fs.readFileSync(secretKeyPath, 'utf8');

// Parse PEM to extract Ed25519 private key
const base64Match = pemContent.match(/-----BEGIN PRIVATE KEY-----\s*([A-Za-z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/);
if (!base64Match) {
  console.error('❌ Failed to parse PEM file');
  process.exit(1);
}

const base64Content = base64Match[1].replace(/\s/g, '');
const rawKey = Buffer.from(base64Content, 'base64');
const privateKeyBytes = rawKey.slice(16, 48); // Ed25519 key at offset 16 in PKCS#8

// Parse with Casper SDK
let keyPair;
try {
  keyPair = casperSDK.Keys.Ed25519.parsePrivateKey(privateKeyBytes);
} catch (e) {
  console.error('❌ Failed to parse private key:', e.message);
  process.exit(1);
}

// Load WASM file
const wasmPath = path.join(__dirname, 'wasm', 'YieldOptimizer.wasm');
const wasmBytes = new Uint8Array(fs.readFileSync(wasmPath));

console.log('📋 Deploying YieldOptimizer to Casper Testnet...');
console.log(`   Node: ${NODE_URL}`);
console.log(`   Network: ${NETWORK_NAME}`);
console.log(`   Public Key: ${keyPair.publicKey.toHex()}`);
console.log(`   WASM Size: ${wasmBytes.length} bytes`);
console.log('');

// Create deploy
const deployParams = new DeployUtil.DeployParams(
  keyPair.publicKey,
  NETWORK_NAME,
  GAS_PRICE,
  TTL
);

// Session arguments (init args)
const runtimeArgs = DeployUtil.RuntimeArgs.fromMap({
  management_fee_bp: DeployUtil.CLValueBuilder.u32(100) // 1% fee (100 basis points)
});

const session = DeployUtil.ExecutableDeployItem.newModuleBytes(
  wasmBytes,
  runtimeArgs
);

const payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);

const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
const signedDeploy = deploy.sign([keyPair]);

// Send deploy
const client = new CasperClient(NODE_URL);

client.putDeploy(signedDeploy)
  .then(deployHash => {
    console.log('✅ Deploy successful!');
    console.log(`   Deploy Hash: ${deployHash}`);
    console.log(`   Explorer: https://testnet.cspr.live/deploy/${deployHash}`);
    console.log('');
    console.log('⏳ Waiting for deploy to be processed...');
    console.log('   This may take 1-2 minutes.');
    console.log('');

    // Poll for contract hash
    return pollForContractHash(client, deployHash, keyPair.publicKey);
  })
  .then(contractHash => {
    console.log('');
    console.log('🎉 Contract deployed successfully!');
    console.log(`   Contract Hash: ${contractHash}`);
    console.log(`   Explorer: https://testnet.cspr.live/contract/${contractHash}`);
    console.log('');
    console.log('📝 Update your .env files with:');
    console.log(`   VITE_CONTRACT_HASH=${contractHash}`);
    console.log(`   CONTRACT_HASH=${contractHash}`);
  })
  .catch(error => {
    console.error('❌ Error deploying contract:');
    console.error(error);
    process.exit(1);
  });

async function pollForContractHash(client, deployHash, publicKey) {
  const maxAttempts = 60; // 5 minutes with 5-second intervals

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const [deploy, raw] = await client.getDeploy(deployHash);

      if (raw.execution_results && raw.execution_results.length > 0) {
        const executionResult = raw.execution_results[0].result;

        if (executionResult.Success) {
          // Extract contract hash from transforms
          const transforms = executionResult.Success.effect.transforms;
          for (const transform of transforms) {
            if (transform.transform === 'WriteContract' ||
                (transform.transform && transform.transform.WriteContract)) {
              const contractHash = transform.key.replace('hash-', '');
              return `hash-${contractHash}`;
            }
          }

          // Alternative: get from named keys
          const accountHash = publicKey.toAccountHashStr().slice(13);
          const accountInfo = await client.nodeClient.getBlockState(
            raw.execution_results[0].block_hash,
            `account-hash-${accountHash}`,
            []
          );

          if (accountInfo && accountInfo.Account && accountInfo.Account.namedKeys) {
            const contractHashKey = Object.entries(accountInfo.Account.namedKeys)
              .find(([key]) => key.includes('yield_optimizer') || key.includes('YieldOptimizer'));

            if (contractHashKey) {
              return contractHashKey[1].key;
            }
          }
        } else if (executionResult.Failure) {
          throw new Error(`Deploy failed: ${JSON.stringify(executionResult.Failure)}`);
        }
      }

      // Wait 5 seconds before next attempt
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      if (i === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  throw new Error('Timeout waiting for contract deployment');
}
