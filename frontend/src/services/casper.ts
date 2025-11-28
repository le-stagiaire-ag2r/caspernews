// Casper service for blockchain interactions using casper-js-sdk v5
import {
  PublicKey,
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  StoredContractByHash,
  Args,
  CLValue,
  ContractHash,
  RpcClient,
  HttpHandler,
} from 'casper-js-sdk';

export const CASPER_NETWORK_NAME = import.meta.env.VITE_CASPER_NETWORK || 'casper-test';
export const CONTRACT_HASH = import.meta.env.VITE_CONTRACT_HASH || 'hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df';
export const RPC_URL = import.meta.env.VITE_CASPER_RPC_URL || 'https://rpc.testnet.casperlabs.io/rpc';

// Initialize RPC client with HTTP handler
const httpHandler = new HttpHandler(RPC_URL);
export const rpcClient = new RpcClient(httpHandler);

/**
 * Convert CSPR to motes (1 CSPR = 1,000,000,000 motes)
 */
export const csprToMotes = (cspr: string): string => {
  const amount = parseFloat(cspr);
  if (isNaN(amount)) return '0';
  return Math.floor(amount * 1_000_000_000).toString();
};

/**
 * Convert motes to CSPR (1,000,000,000 motes = 1 CSPR)
 */
export const motesToCspr = (motes: string): string => {
  const amount = parseFloat(motes);
  if (isNaN(amount)) return '0';
  return (amount / 1_000_000_000).toFixed(9);
};

/**
 * Estimate gas for deposit (simplified)
 */
export const estimateGas = (actionType: 'deposit' | 'withdraw'): string => {
  return actionType === 'deposit' ? '5' : '7';
};

/**
 * Create a deposit deploy to stake CSPR in the YieldOptimizer contract
 */
export const createDepositDeploy = (
  publicKeyHex: string,
  amountCspr: string
): Deploy => {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const amountMotes = csprToMotes(amountCspr);

  // Payment amount for contract call (5 CSPR in motes)
  const paymentAmount = csprToMotes('5');

  // Create contract hash from string - remove 'hash-' prefix if present
  console.log('📋 Original CONTRACT_HASH:', CONTRACT_HASH);
  console.log('📋 CONTRACT_HASH length:', CONTRACT_HASH.length);
  const hashHex = (CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH).trim(); // Remove whitespace/newlines
  console.log('📋 Cleaned hashHex:', hashHex);
  console.log('📋 hashHex length:', hashHex.length);
  const contractHash = ContractHash.newContract(hashHex);

  // Runtime arguments for deposit - Odra expects 'amount' as attached value
  const args = Args.fromMap({
    amount: CLValue.newCLUInt512(amountMotes),
  });

  // Create deploy header
  const header = new DeployHeader(
    CASPER_NETWORK_NAME, // chainName
    [], // dependencies
    1, // gasPrice
    undefined, // timestamp (will be set automatically)
    undefined, // ttl (default 30 minutes)
    publicKey // account
  );

  // Create session (contract call)
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    contractHash,
    'deposit',
    args
  );

  // Create payment
  const payment = ExecutableDeployItem.standardPayment(paymentAmount);

  // Create deploy
  const deploy = Deploy.makeDeploy(header, payment, session);

  return deploy;
};

/**
 * Create a withdraw deploy to unstake shares from the YieldOptimizer contract
 */
export const createWithdrawDeploy = (
  publicKeyHex: string,
  sharesAmount: string
): Deploy => {
  const publicKey = PublicKey.fromHex(publicKeyHex);

  // Payment amount for contract call (7 CSPR in motes)
  const paymentAmount = csprToMotes('7');

  // Create contract hash from string - remove 'hash-' prefix if present
  console.log('📋 Original CONTRACT_HASH:', CONTRACT_HASH);
  console.log('📋 CONTRACT_HASH length:', CONTRACT_HASH.length);
  const hashHex = (CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH).trim(); // Remove whitespace/newlines
  console.log('📋 Cleaned hashHex:', hashHex);
  console.log('📋 hashHex length:', hashHex.length);
  const contractHash = ContractHash.newContract(hashHex);

  // Runtime arguments for withdraw
  const args = Args.fromMap({
    shares: CLValue.newCLUInt256(sharesAmount),
  });

  // Create deploy header
  const header = new DeployHeader(
    CASPER_NETWORK_NAME, // chainName
    [], // dependencies
    1, // gasPrice
    undefined, // timestamp (will be set automatically)
    undefined, // ttl (default 30 minutes)
    publicKey // account
  );

  // Create session (contract call)
  const session = new ExecutableDeployItem();
  session.storedContractByHash = new StoredContractByHash(
    contractHash,
    'withdraw',
    args
  );

  // Create payment
  const payment = ExecutableDeployItem.standardPayment(paymentAmount);

  // Create deploy
  const deploy = Deploy.makeDeploy(header, payment, session);

  return deploy;
};

/**
 * Sign and submit a deploy using the connected wallet provider
 */
export const signAndSubmitDeploy = async (
  deploy: Deploy,
  walletProvider: any
): Promise<string> => {
  try {
    // Serialize deploy for signing
    const deployJson = Deploy.toJSON(deploy);

    console.log('📤 Sending deploy to wallet for signing...');

    // Sign with wallet provider
    const signedDeployData = await walletProvider.sign(
      JSON.stringify(deployJson),
      deploy.header.account!.toHex()
    );

    console.log('✅ Deploy signed by wallet');
    console.log('📋 Signed deploy data type:', typeof signedDeployData);
    console.log('📋 Signed deploy data keys:', Object.keys(signedDeployData || {}));
    console.log('📋 Signed deploy data:', JSON.stringify(signedDeployData, null, 2));
    console.log('📋 Is string?', typeof signedDeployData === 'string');

    // Try to parse if it's a string, otherwise use directly
    let deployToSubmit;
    if (typeof signedDeployData === 'string') {
      // Parse the JSON string first
      const parsedData = JSON.parse(signedDeployData);
      deployToSubmit = Deploy.fromJSON(parsedData);
    } else if (signedDeployData && typeof signedDeployData === 'object') {
      // Check if it's already a Deploy instance
      if (signedDeployData.constructor && signedDeployData.constructor.name === 'Deploy') {
        console.log('📋 Already a Deploy instance');
        deployToSubmit = signedDeployData;
      } else {
        // Check if it's a wrapper object with a 'deploy' field
        if ('deploy' in signedDeployData) {
          console.log('📋 Found deploy field in response, extracting...');
          deployToSubmit = Deploy.fromJSON(signedDeployData.deploy);
        } else if ('signedDeploy' in signedDeployData) {
          console.log('📋 Found signedDeploy field in response, extracting...');
          deployToSubmit = Deploy.fromJSON(signedDeployData.signedDeploy);
        } else {
          // Try to use it directly as a deploy JSON
          console.log('📋 Attempting to parse as deploy JSON');
          deployToSubmit = Deploy.fromJSON(signedDeployData);
        }
      }
    } else {
      throw new Error('Unexpected signed deploy data format');
    }

    console.log('✅ Deploy ready for submission');

    // Submit to network
    const result = await rpcClient.putDeploy(deployToSubmit);

    const deployHashString = result.deployHash.toHex();
    console.log('✅ Deploy submitted:', deployHashString);
    return deployHashString;
  } catch (error) {
    console.error('❌ Deploy submission failed:', error);
    throw error;
  }
};

/**
 * Get deploy status by hash
 */
export const getDeployStatus = async (deployHash: string): Promise<any> => {
  try {
    const result = await rpcClient.getDeploy(deployHash);
    return result;
  } catch (error) {
    console.error('Failed to get deploy status:', error);
    throw error;
  }
};
