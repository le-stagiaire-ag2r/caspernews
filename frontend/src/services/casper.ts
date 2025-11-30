// Casper service using casper-js-sdk v5
import {
  PublicKey,
  Args,
  CLValue,
  RpcClient,
  HttpHandler,
  ContractCallBuilder,
  Hash,
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
 * Create a deposit transaction using SDK v5 ContractCallBuilder
 * Returns transaction ready to be signed by CSPR.click
 */
export const createDepositTransaction = (
  publicKeyHex: string,
  amountCspr: string
) => {
  const amountMotes = csprToMotes(amountCspr);
  const paymentMotes = csprToMotes('5'); // 5 CSPR gas payment

  // Get contract hash without 'hash-' prefix
  const contractHashHex = CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH;

  console.log('📋 Creating deposit transaction (SDK v5):');
  console.log('  Contract Hash:', contractHashHex);
  console.log('  Amount:', amountCspr, 'CSPR');
  console.log('  Public Key:', publicKeyHex);

  // Runtime arguments for deposit
  const args = Args.fromMap({
    amount: CLValue.newCLUInt512(amountMotes),
  });

  // Build transaction using ContractCallBuilder (SDK v5)
  const transaction = new ContractCallBuilder()
    .from(PublicKey.fromHex(publicKeyHex))
    .contractHash(Hash.fromHex(contractHashHex))
    .entryPoint('deposit')
    .runtimeArgs(args)
    .payment(paymentMotes)
    .chainName(CASPER_NETWORK_NAME)
    .build();

  console.log('✅ Transaction created (SDK v5)');

  // Return in CSPR.click format
  return {
    transaction: {
      Version1: transaction.toJSON()
    }
  };
};

/**
 * Create a withdraw transaction using SDK v5 ContractCallBuilder
 * Returns transaction ready to be signed by CSPR.click
 */
export const createWithdrawTransaction = (
  publicKeyHex: string,
  sharesAmount: string
) => {
  const paymentMotes = csprToMotes('7'); // 7 CSPR gas payment

  // Get contract hash without 'hash-' prefix
  const contractHashHex = CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH;

  console.log('📋 Creating withdraw transaction (SDK v5):');
  console.log('  Contract Hash:', contractHashHex);
  console.log('  Shares:', sharesAmount);
  console.log('  Public Key:', publicKeyHex);

  // Runtime arguments for withdraw
  const args = Args.fromMap({
    shares: CLValue.newCLUInt256(sharesAmount),
  });

  // Build transaction using ContractCallBuilder (SDK v5)
  const transaction = new ContractCallBuilder()
    .from(PublicKey.fromHex(publicKeyHex))
    .contractHash(Hash.fromHex(contractHashHex))
    .entryPoint('withdraw')
    .runtimeArgs(args)
    .payment(paymentMotes)
    .chainName(CASPER_NETWORK_NAME)
    .build();

  console.log('✅ Transaction created (SDK v5)');

  // Return in CSPR.click format
  return {
    transaction: {
      Version1: transaction.toJSON()
    }
  };
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
