// Casper service using casper-js-sdk v5
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
export const RPC_URL = 'https://rpc.testnet.casperlabs.io/rpc'; // For status queries only

// Initialize RPC client for queries (not for submitting - CSPR.click handles that)
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
 * Create a deposit transaction
 * This returns a deploy object ready to be signed by CSPR.click
 */
export const createDepositTransaction = (
  publicKeyHex: string,
  amountCspr: string
) => {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const amountMotes = csprToMotes(amountCspr);

  // Payment amount for contract call (5 CSPR in motes)
  const paymentAmount = csprToMotes('5');

  // Get contract hash without 'hash-' prefix
  const contractHashHex = CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH;

  console.log('📋 Creating deposit transaction:');
  console.log('  Contract Hash:', contractHashHex);
  console.log('  Amount:', amountCspr, 'CSPR');
  console.log('  Public Key:', publicKeyHex);

  const contractHash = ContractHash.newContract(contractHashHex);

  // Runtime arguments for deposit
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

  console.log('✅ Deploy created');

  // Return deploy JSON for CSPR.click
  return Deploy.toJSON(deploy);
};

/**
 * Create a withdraw transaction
 */
export const createWithdrawTransaction = (
  publicKeyHex: string,
  sharesAmount: string
) => {
  const publicKey = PublicKey.fromHex(publicKeyHex);

  // Payment amount for contract call (7 CSPR in motes)
  const paymentAmount = csprToMotes('7');

  // Get contract hash without 'hash-' prefix
  const contractHashHex = CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH;

  console.log('📋 Creating withdraw transaction:');
  console.log('  Contract Hash:', contractHashHex);
  console.log('  Shares:', sharesAmount);
  console.log('  Public Key:', publicKeyHex);

  const contractHash = ContractHash.newContract(contractHashHex);

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

  console.log('✅ Deploy created');

  // Return deploy JSON for CSPR.click
  return Deploy.toJSON(deploy);
};

/**
 * Get deploy status by hash
 * Uses RPC directly (no CORS issue for queries)
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
