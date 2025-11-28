const fs = require('fs');
const path = require('path');
const SDK = require('casper-js-sdk');

// Configuration
const NODE_URL = 'https://rpc.testnet.casperlabs.io';
const NETWORK_NAME = 'casper-test';
const PAYMENT_AMOUNT = 200_000_000_000; // 200 CSPR

// Load WASM
const wasmPath = path.join(__dirname, 'wasm', 'YieldOptimizer.wasm');
const wasmBytes = new Uint8Array(fs.readFileSync(wasmPath));

// Load secret key from PEM
const secretKeyPath = path.join(__dirname, 'secret_key.pem');
const pemContent = fs.readFileSync(secretKeyPath, 'utf8');

// Parse PEM - extract base64 content
const base64Match = pemContent.match(/-----BEGIN PRIVATE KEY-----\s*([A-Za-z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/);
if (!base64Match) {
  console.error('❌ Failed to parse PEM file');
  process.exit(1);
}

const base64Content = base64Match[1].replace(/\s/g, '');
const rawKey = Buffer.from(base64Content, 'base64');

// Ed25519 private key is at offset 16 in the PKCS#8 format, 32 bytes
const privateKeyBytes = rawKey.slice(16, 48);

console.log('📋 Deploying YieldOptimizer to Casper Testnet...');
console.log(`   Node: ${NODE_URL}`);
console.log(`   Network: ${NETWORK_NAME}`);
console.log(`   WASM Size: ${wasmBytes.length} bytes`);

async function deploy() {
  try {
    // Create keypair using SDK
    const keyPair = SDK.Keys.Ed25519.parsePrivateKey(privateKeyBytes);
    const publicKey = keyPair.publicKey;

    console.log(`   Public Key: ${publicKey.toHex()}`);
    console.log('');

    // Create deploy parameters
    const deployParams = new SDK.DeployUtil.DeployParams(
      publicKey,
      NETWORK_NAME,
      1, // gas price
      1800000 // TTL
    );

    // Runtime args for init
    const args = SDK.RuntimeArgs.fromMap({
      'management_fee_bp': SDK.CLValueBuilder.u32(100) // 1%
    });

    // Create session
    const session = SDK.DeployUtil.ExecutableDeployItem.newModuleBytes(
      wasmBytes,
      args
    );

    // Payment
    const payment = SDK.DeployUtil.standardPayment(PAYMENT_AMOUNT);

    // Create deploy
    const deploy = SDK.DeployUtil.makeDeploy(deployParams, session, payment);

    // Sign
    const signedDeploy = deploy.sign([keyPair]);

    // Send
    const client = new SDK.CasperClient(NODE_URL);
    const deployHash = await client.putDeploy(signedDeploy);

    console.log('✅ Deploy submitted!');
    console.log(`   Deploy Hash: ${deployHash}`);
    console.log(`   Explorer: https://testnet.cspr.live/deploy/${deployHash}`);
    console.log('');
    console.log('⏳ Waiting for execution... (1-2 minutes)');
    console.log('');
    console.log('📝 After deployment completes, find the contract hash at:');
    console.log(`   https://testnet.cspr.live/deploy/${deployHash}`);

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    if (error.data) {
      console.error('Data:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
