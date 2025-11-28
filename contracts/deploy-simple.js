const fs = require('fs');
const path = require('path');
const { CasperClient, CLPublicKey, CLValueBuilder, DeployUtil, RuntimeArgs } = require('casper-js-sdk');

// Configuration
const NODE_URL = 'https://rpc.testnet.casperlabs.io';
const NETWORK_NAME = 'casper-test';
const PAYMENT_AMOUNT = '200000000000'; // 200 CSPR (safe amount for contract deployment)

// Load and parse private key from PEM file
const secretKeyPath = path.join(__dirname, 'secret_key.pem');
const pemContent = fs.readFileSync(secretKeyPath, 'utf8');
const base64Match = pemContent.match(/-----BEGIN PRIVATE KEY-----\s*([A-Za-z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/);
if (!base64Match) {
  console.error('❌ Failed to parse PEM file');
  process.exit(1);
}
const base64Content = base64Match[1].replace(/\s/g, '');
const rawKey = Buffer.from(base64Content, 'base64');
const privateKeyBytes = rawKey.slice(16, 48); // Ed25519 key at offset 16, 32 bytes

// Create keypair from raw bytes
const nacl = require('tweetnacl');
const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);
const publicKey = CLPublicKey.fromEd25519(keyPair.publicKey);
const privateKey = keyPair.secretKey;

// Load WASM file
const wasmPath = path.join(__dirname, 'wasm', 'YieldOptimizer.wasm');
const wasmBytes = fs.readFileSync(wasmPath);

console.log('📋 Deploying YieldOptimizer to Casper Testnet...');
console.log(`   Node: ${NODE_URL}`);
console.log(`   Network: ${NETWORK_NAME}`);
console.log(`   Public Key: ${publicKey.toHex()}`);
console.log(`   WASM Size: ${wasmBytes.length} bytes`);
console.log('');

async function deploy() {
  try {
    // Create deploy parameters
    const deployParams = new DeployUtil.DeployParams(
      publicKey,
      NETWORK_NAME,
      1, // gas price
      1800000 // TTL ms
    );

    // Init arguments for the contract
    const args = RuntimeArgs.fromMap({
      'management_fee_bp': CLValueBuilder.u32(100) // 1% management fee
    });

    // Create session from module bytes
    const session = DeployUtil.ExecutableDeployItem.newModuleBytes(
      wasmBytes,
      args
    );

    // Payment
    const payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);

    // Make deploy
    const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

    // Sign deploy
    const signedDeploy = DeployUtil.signDeploy(deploy, keyPair);

    // Send deploy
    const client = new CasperClient(NODE_URL);
    const deployHash = await client.putDeploy(signedDeploy);

    console.log('✅ Deploy submitted successfully!');
    console.log(`   Deploy Hash: ${deployHash}`);
    console.log(`   Explorer: https://testnet.cspr.live/deploy/${deployHash}`);
    console.log('');
    console.log('⏳ Waiting for execution (this may take 1-2 minutes)...');
    console.log('   Check the explorer link above for status updates.');
    console.log('');
    console.log('💡 To get the contract hash after deployment:');
    console.log(`   Visit: https://testnet.cspr.live/deploy/${deployHash}`);
    console.log('   Look for the contract hash in the execution results.');

  } catch (error) {
    console.error('❌ Deployment failed:');
    console.error(error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.data) {
      console.error('Error data:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
