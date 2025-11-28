// Casper service for blockchain interactions using casper-js-sdk v5
import {
  CasperClient,
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  RuntimeArgs,
} from 'casper-js-sdk';

export const CASPER_NETWORK_NAME = import.meta.env.VITE_CASPER_NETWORK || 'casper-test';
export const CONTRACT_HASH = import.meta.env.VITE_CONTRACT_HASH || 'hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df';
export const RPC_URL = import.meta.env.VITE_CASPER_RPC_URL || 'https://rpc.testnet.casperlabs.io/rpc';

// Initialize Casper client
export const casperClient = new CasperClient(RPC_URL);

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
): DeployUtil.Deploy => {
  const publicKey = CLPublicKey.fromHex(publicKeyHex);
  const amountMotes = csprToMotes(amountCspr);

  // Payment amount for contract call (5 CSPR)
  const paymentAmount = csprToMotes('5');

  // Contract hash without 'hash-' prefix
  const contractHashBytes = CONTRACT_HASH.replace('hash-', '');

  // Runtime arguments for deposit - Odra expects 'amount' as attached value
  const args = RuntimeArgs.fromMap({
    amount: CLValueBuilder.u512(amountMotes),
  });

  // Create deploy
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      publicKey,
      CASPER_NETWORK_NAME,
      1, // gasPrice
      1800000 // ttl (30 minutes)
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Uint8Array.from(Buffer.from(contractHashBytes, 'hex')),
      'deposit',
      args
    ),
    DeployUtil.standardPayment(paymentAmount)
  );

  return deploy;
};

/**
 * Create a withdraw deploy to unstake shares from the YieldOptimizer contract
 */
export const createWithdrawDeploy = (
  publicKeyHex: string,
  sharesAmount: string
): DeployUtil.Deploy => {
  const publicKey = CLPublicKey.fromHex(publicKeyHex);

  // Payment amount for contract call (7 CSPR)
  const paymentAmount = csprToMotes('7');

  // Contract hash without 'hash-' prefix
  const contractHashBytes = CONTRACT_HASH.replace('hash-', '');

  // Runtime arguments for withdraw
  const args = RuntimeArgs.fromMap({
    shares: CLValueBuilder.u256(sharesAmount),
  });

  // Create deploy
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      publicKey,
      CASPER_NETWORK_NAME,
      1, // gasPrice
      1800000 // ttl (30 minutes)
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Uint8Array.from(Buffer.from(contractHashBytes, 'hex')),
      'withdraw',
      args
    ),
    DeployUtil.standardPayment(paymentAmount)
  );

  return deploy;
};

/**
 * Sign and submit a deploy using the connected wallet provider
 */
export const signAndSubmitDeploy = async (
  deploy: DeployUtil.Deploy,
  walletProvider: any
): Promise<string> => {
  try {
    // Serialize deploy for signing
    const deployJson = DeployUtil.deployToJson(deploy);

    // Sign with wallet provider
    const signedDeployJson = await walletProvider.sign(
      JSON.stringify(deployJson),
      deploy.header.account.toHex()
    );

    // Parse signed deploy
    const signedDeploy = DeployUtil.deployFromJson(JSON.parse(signedDeployJson)).val;

    // Submit to network
    const deployHash = await casperClient.putDeploy(signedDeploy);

    console.log('✅ Deploy submitted:', deployHash);
    return deployHash;
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
    const result = await casperClient.getDeploy(deployHash);
    return result;
  } catch (error) {
    console.error('Failed to get deploy status:', error);
    throw error;
  }
};
