import {
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  RuntimeArgs,
} from 'casper-js-sdk';

export const CASPER_NETWORK_NAME = import.meta.env.VITE_CASPER_NETWORK || 'casper-test';
export const CONTRACT_HASH = import.meta.env.VITE_CONTRACT_HASH || '';
export const RPC_URL = import.meta.env.VITE_CASPER_RPC_URL || 'https://rpc.testnet.casperlabs.io/rpc';

export interface DeployParams {
  publicKey: string;
  amount: string;
  action: 'deposit' | 'withdraw';
}

/**
 * Estimate gas cost for a transaction
 */
export const estimateGas = (action: 'deposit' | 'withdraw'): string => {
  // Gas estimates (in motes)
  const gasEstimates = {
    deposit: '5000000000',    // 5 CSPR
    withdraw: '7000000000',   // 7 CSPR (slightly higher due to reward calculations)
  };

  return gasEstimates[action];
};

/**
 * Build runtime arguments for deposit
 */
export const buildDepositArgs = (amount: string): RuntimeArgs => {
  return RuntimeArgs.fromMap({
    amount: CLValueBuilder.u512(amount),
  });
};

/**
 * Build runtime arguments for withdrawal
 */
export const buildWithdrawArgs = (shares: string): RuntimeArgs => {
  return RuntimeArgs.fromMap({
    shares_to_withdraw: CLValueBuilder.u512(shares),
  });
};

/**
 * Create a deploy for deposit transaction
 */
export const createDepositDeploy = (
  publicKeyHex: string,
  amount: string,
): DeployUtil.Deploy => {
  const publicKey = CLPublicKey.fromHex(publicKeyHex);
  const args = buildDepositArgs(amount);
  const gasPayment = estimateGas('deposit');

  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      publicKey,
      CASPER_NETWORK_NAME,
      1, // Gas price (1 mote)
      1800000, // TTL: 30 minutes
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Uint8Array.from(Buffer.from(CONTRACT_HASH.replace('hash-', ''), 'hex')),
      'deposit',
      args,
    ),
    DeployUtil.standardPayment(gasPayment),
  );

  return deploy;
};

/**
 * Create a deploy for withdrawal transaction
 */
export const createWithdrawDeploy = (
  publicKeyHex: string,
  shares: string,
): DeployUtil.Deploy => {
  const publicKey = CLPublicKey.fromHex(publicKeyHex);
  const args = buildWithdrawArgs(shares);
  const gasPayment = estimateGas('withdraw');

  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      publicKey,
      CASPER_NETWORK_NAME,
      1,
      1800000,
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Uint8Array.from(Buffer.from(CONTRACT_HASH.replace('hash-', ''), 'hex')),
      'withdraw',
      args,
    ),
    DeployUtil.standardPayment(gasPayment),
  );

  return deploy;
};

/**
 * Convert CSPR to motes (1 CSPR = 10^9 motes)
 */
export const csprToMotes = (cspr: string): string => {
  const amount = parseFloat(cspr);
  return Math.floor(amount * 1_000_000_000).toString();
};

/**
 * Convert motes to CSPR
 */
export const motesToCspr = (motes: string): string => {
  const amount = parseInt(motes);
  return (amount / 1_000_000_000).toFixed(9);
};

/**
 * Submit a signed deploy to the Casper Network
 */
export const submitDeploy = async (
  signedDeploy: DeployUtil.Deploy,
): Promise<string> => {
  const deployJson = DeployUtil.deployToJson(signedDeploy);

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'account_put_deploy',
      params: [deployJson],
      id: 1,
    }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.result.deploy_hash;
};
