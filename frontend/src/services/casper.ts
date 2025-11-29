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
  Hash,
  RpcClient,
  HttpHandler,
  Approval,
  HexBytes,
  CasperNetwork,
  ContractCallBuilder,
} from 'casper-js-sdk';

export const CASPER_NETWORK_NAME = import.meta.env.VITE_CASPER_NETWORK || 'casper-test';
export const CONTRACT_HASH = import.meta.env.VITE_CONTRACT_HASH || 'hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df';
// Use Vercel serverless proxy to avoid CORS issues
export const RPC_URL = import.meta.env.VITE_CASPER_RPC_URL || '/api/casper-rpc';

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
 * Build deposit transaction for CSPR.click
 * Returns transaction in the format expected by clickRef.send()
 */
export const buildDepositTransaction = (
  publicKeyHex: string,
  amountCspr: string
) => {
  const amountMotes = csprToMotes(amountCspr);
  const paymentMotes = csprToMotes('5'); // 5 CSPR gas

  // Remove 'hash-' prefix if present
  const hashHex = CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH;

  console.log('📋 Building deposit transaction');
  console.log('📋 Sender:', publicKeyHex);
  console.log('📋 Amount:', amountCspr, 'CSPR (', amountMotes, 'motes)');
  console.log('📋 Contract hash:', hashHex);

  // Runtime arguments for deposit
  const args = Args.fromMap({
    amount: CLValue.newCLUInt512(amountMotes),
  });

  // Build transaction using ContractCallBuilder
  const transaction = new ContractCallBuilder()
    .from(PublicKey.fromHex(publicKeyHex))
    .contractHash(Hash.fromHex(hashHex))
    .entryPoint('deposit')
    .runtimeArgs(args)
    .payment(Number.parseInt(paymentMotes, 10))
    .chainName((window as any).csprclick?.chainName || CASPER_NETWORK_NAME)
    .build();

  console.log('✅ Transaction built successfully');

  // Return in format expected by CSPR.click
  return {
    transaction: {
      Version1: transaction.toJSON()
    }
  };
};

/**
 * Build withdraw transaction for CSPR.click
 * Returns transaction in the format expected by clickRef.send()
 */
export const buildWithdrawTransaction = (
  publicKeyHex: string,
  sharesAmount: string
) => {
  const paymentMotes = csprToMotes('7'); // 7 CSPR gas

  // Remove 'hash-' prefix if present
  const hashHex = CONTRACT_HASH.startsWith('hash-')
    ? CONTRACT_HASH.substring(5)
    : CONTRACT_HASH;

  console.log('📋 Building withdraw transaction');
  console.log('📋 Sender:', publicKeyHex);
  console.log('📋 Shares:', sharesAmount);
  console.log('📋 Contract hash:', hashHex);

  // Runtime arguments for withdraw
  const args = Args.fromMap({
    shares: CLValue.newCLUInt256(sharesAmount),
  });

  // Build transaction using ContractCallBuilder
  const transaction = new ContractCallBuilder()
    .from(PublicKey.fromHex(publicKeyHex))
    .contractHash(Hash.fromHex(hashHex))
    .entryPoint('withdraw')
    .runtimeArgs(args)
    .payment(Number.parseInt(paymentMotes, 10))
    .chainName((window as any).csprclick?.chainName || CASPER_NETWORK_NAME)
    .build();

  console.log('✅ Transaction built successfully');

  // Return in format expected by CSPR.click
  return {
    transaction: {
      Version1: transaction.toJSON()
    }
  };
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

    // Sign with wallet provider - it returns just the signature, not the full deploy
    const signatureResponse = await walletProvider.sign(
      JSON.stringify(deployJson),
      deploy.header.account!.toHex()
    );

    console.log('✅ Signature received from wallet');
    console.log('📋 Signature hex:', signatureResponse.signatureHex);

    if (signatureResponse.cancelled) {
      throw new Error('User cancelled the signing request');
    }

    // Add the signature to the original deploy
    // The signature bytes are in the 'signature' field
    const signatureBytes = new Uint8Array(Object.values(signatureResponse.signature));

    // Create a HexBytes object from the signature
    const signature = new HexBytes(signatureBytes);

    // Create an Approval with the signer's public key and signature
    const approval = new Approval(deploy.header.account!, signature);

    // Add the approval using the proper method
    deploy.addApproval(approval);

    console.log('✅ Signature added to deploy');
    console.log('📋 Deploy approvals count:', deploy.approvals.length);
    console.log('📋 Deploy hash:', deploy.hash.toHex());
    console.log('📋 Submitting to RPC using rpcClient.putDeploy()');

    // Submit to network using rpcClient.putDeploy() as recommended in migration guide
    try {
      const result = await rpcClient.putDeploy(deploy);
      const deployHashString = result.deployHash.toHex();
      console.log('✅ Deploy submitted:', deployHashString);
      return deployHashString;
    } catch (rpcError: any) {
      console.error('❌ RPC putDeploy failed:', rpcError);
      console.error('❌ RPC error details:', {
        message: rpcError.message,
        stack: rpcError.stack,
        name: rpcError.name,
      });
      throw rpcError;
    }
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
