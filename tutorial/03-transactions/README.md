# Part 3: Constructing and Signing Casper Transactions

In this part, you'll master the Casper transaction model and learn how to construct, sign, and submit transactions (called "deploys") to the blockchain.

## 📖 What You'll Learn

- Understanding Casper's deploy model
- Constructing deposits and withdrawals
- Estimating gas costs
- Signing transactions with CSPR.click
- Handling transaction submission and monitoring
- Error handling and retry logic

## 🧩 Understanding Casper Deploys

In Casper Network, transactions are called **deploys**. A deploy contains:

### Deploy Structure

```typescript
{
  header: {
    account: PublicKey,      // Who's sending
    timestamp: Timestamp,     // When it was created
    ttl: Duration,           // Time to live
    gas_price: number,       // Price per gas unit
    body_hash: Hash,         // Hash of the deploy body
    dependencies: Hash[],    // Previous deploys (optional)
    chain_name: string       // Network identifier
  },
  payment: ExecutableDeployItem,  // How gas is paid
  session: ExecutableDeployItem,  // What to execute
  approvals: Approval[]           // Signatures
}
```

### Key Concepts

**1. Payment vs Session**
- **Payment**: Code that pays for the deploy (usually standard payment)
- **Session**: Your actual smart contract call

**2. Gas Model**
- Fixed gas price (1 mote = 10^-9 CSPR)
- Estimate gas before sending
- Unused gas is refunded

**3. TTL (Time To Live)**
- How long the deploy is valid
- Usually 30 minutes (1800000 milliseconds)
- Prevents replay attacks

## 🔧 Setting Up Transaction Service

Create `src/services/casper.ts`:

```typescript
import {
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  RuntimeArgs,
} from 'casper-js-sdk';

export const CASPER_NETWORK_NAME = import.meta.env.VITE_CASPER_NETWORK || 'casper-test';
export const CONTRACT_HASH = import.meta.env.VITE_CONTRACT_HASH;

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
export const buildWithdrawArgs = (amount: string): RuntimeArgs => {
  return RuntimeArgs.fromMap({
    amount: CLValueBuilder.u512(amount),
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
      Uint8Array.from(Buffer.from(CONTRACT_HASH, 'hex')),
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
  amount: string,
): DeployUtil.Deploy => {
  const publicKey = CLPublicKey.fromHex(publicKeyHex);
  const args = buildWithdrawArgs(amount);
  const gasPayment = estimateGas('withdraw');

  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      publicKey,
      CASPER_NETWORK_NAME,
      1,
      1800000,
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      Uint8Array.from(Buffer.from(CONTRACT_HASH, 'hex')),
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
  return (amount * 1_000_000_000).toString();
};

/**
 * Convert motes to CSPR
 */
export const motesToCspr = (motes: string): string => {
  const amount = parseInt(motes);
  return (amount / 1_000_000_000).toFixed(9);
};
```

## 🔐 Signing Transactions

Create `src/hooks/useTransaction.ts`:

```typescript
import { useState } from 'react';
import { useClick } from '@make-software/csprclick-ui';
import {
  createDepositDeploy,
  createWithdrawDeploy,
  csprToMotes,
} from '../services/casper';
import { DeployUtil } from 'casper-js-sdk';

export interface TransactionState {
  isLoading: boolean;
  error: string | null;
  deployHash: string | null;
}

export const useTransaction = () => {
  const { activeAccount, signDeploy } = useClick();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    deployHash: null,
  });

  /**
   * Execute a deposit transaction
   */
  const deposit = async (amountCspr: string) => {
    if (!activeAccount) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    setState({ isLoading: true, error: null, deployHash: null });

    try {
      // Convert CSPR to motes
      const amountMotes = csprToMotes(amountCspr);

      // Create the deploy
      const deploy = createDepositDeploy(
        activeAccount.public_key,
        amountMotes,
      );

      // Sign the deploy with connected wallet
      const signedDeploy = await signDeploy(deploy);

      if (!signedDeploy) {
        throw new Error('User rejected transaction');
      }

      // Submit to the network
      const deployHash = await submitDeploy(signedDeploy);

      setState({
        isLoading: false,
        error: null,
        deployHash,
      });

      return deployHash;
    } catch (error: any) {
      console.error('Deposit failed:', error);
      setState({
        isLoading: false,
        error: error.message || 'Transaction failed',
        deployHash: null,
      });
      return null;
    }
  };

  /**
   * Execute a withdrawal transaction
   */
  const withdraw = async (amountCspr: string) => {
    if (!activeAccount) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    setState({ isLoading: true, error: null, deployHash: null });

    try {
      const amountMotes = csprToMotes(amountCspr);

      const deploy = createWithdrawDeploy(
        activeAccount.public_key,
        amountMotes,
      );

      const signedDeploy = await signDeploy(deploy);

      if (!signedDeploy) {
        throw new Error('User rejected transaction');
      }

      const deployHash = await submitDeploy(signedDeploy);

      setState({
        isLoading: false,
        error: null,
        deployHash,
      });

      return deployHash;
    } catch (error: any) {
      console.error('Withdraw failed:', error);
      setState({
        isLoading: false,
        error: error.message || 'Transaction failed',
        deployHash: null,
      });
      return null;
    }
  };

  /**
   * Reset transaction state
   */
  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      deployHash: null,
    });
  };

  return {
    ...state,
    deposit,
    withdraw,
    reset,
  };
};

/**
 * Submit a signed deploy to the Casper Network
 */
const submitDeploy = async (
  signedDeploy: DeployUtil.Deploy,
): Promise<string> => {
  // In production, use Casper RPC endpoint
  const RPC_URL = 'https://rpc.testnet.casperlabs.io/rpc';

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
```

## 📊 Transaction Monitoring

Create `src/hooks/useDeployStatus.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { DeployUtil } from 'casper-js-sdk';

export type DeployStatus = 'pending' | 'success' | 'failed';

export interface DeployInfo {
  status: DeployStatus;
  blockHash?: string;
  timestamp?: string;
  cost?: string;
  errorMessage?: string;
}

/**
 * Monitor deploy status on the blockchain
 */
export const useDeployStatus = (deployHash: string | null) => {
  return useQuery({
    queryKey: ['deployStatus', deployHash],
    queryFn: () => fetchDeployStatus(deployHash!),
    enabled: !!deployHash,
    refetchInterval: (data) => {
      // Stop refetching once deploy is finalized
      if (data?.status === 'success' || data?.status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
  });
};

/**
 * Fetch deploy status from Casper RPC
 */
const fetchDeployStatus = async (
  deployHash: string,
): Promise<DeployInfo> => {
  const RPC_URL = 'https://rpc.testnet.casperlabs.io/rpc';

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'info_get_deploy',
      params: [deployHash],
      id: 1,
    }),
  });

  const result = await response.json();

  if (result.error) {
    return {
      status: 'failed',
      errorMessage: result.error.message,
    };
  }

  const deploy = result.result.deploy;
  const executionResults = result.result.execution_results;

  if (!executionResults || executionResults.length === 0) {
    return { status: 'pending' };
  }

  const execution = executionResults[0].result;

  if (execution.Success) {
    return {
      status: 'success',
      blockHash: execution.Success.block_hash,
      cost: execution.Success.cost,
    };
  }

  if (execution.Failure) {
    return {
      status: 'failed',
      errorMessage: execution.Failure.error_message,
    };
  }

  return { status: 'pending' };
};
```

## 🎨 Updated Action Panel with Transactions

Update `src/components/ActionPanel.tsx`:

```typescript
import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useTransaction } from '../hooks/useTransaction';
import { useDeployStatus } from '../hooks/useDeployStatus';

type ActionType = 'deposit' | 'withdraw';

export const ActionPanel = () => {
  const { isConnected } = useWallet();
  const { deposit, withdraw, isLoading, error, deployHash, reset } = useTransaction();
  const { data: deployStatus } = useDeployStatus(deployHash);

  const [activeTab, setActiveTab] = useState<ActionType>('deposit');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) return;

    reset(); // Clear previous transaction state

    if (activeTab === 'deposit') {
      await deposit(amount);
    } else {
      await withdraw(amount);
    }

    setAmount(''); // Clear input on success
  };

  if (!isConnected) {
    return (
      <div className="bg-casper-gray rounded-lg p-8 text-center border border-gray-700">
        <p className="text-gray-400">Please connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="bg-casper-gray rounded-lg p-6 border border-gray-700">
      {/* Tab Selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'deposit'
              ? 'bg-casper-red text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
          disabled={isLoading}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'withdraw'
              ? 'bg-casper-red text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
          disabled={isLoading}
        >
          Withdraw
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Amount (CSPR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-casper-red"
            step="0.01"
            min="0"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-casper-red hover:bg-red-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
        >
          {isLoading ? 'Processing...' : activeTab === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </form>

      {/* Transaction Status */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {deployHash && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-blue-400 text-sm mb-2">
            {deployStatus?.status === 'pending' && '⏳ Transaction pending...'}
            {deployStatus?.status === 'success' && '✅ Transaction confirmed!'}
            {deployStatus?.status === 'failed' && `❌ Transaction failed: ${deployStatus.errorMessage}`}
          </p>
          <p className="text-xs text-gray-400 font-mono break-all">
            Deploy Hash: {deployHash}
          </p>
          <a
            href={`https://testnet.cspr.live/deploy/${deployHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-casper-red hover:underline mt-2 inline-block"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-400">
          {activeTab === 'deposit'
            ? '💡 Estimated gas: ~5 CSPR'
            : '⚠️ Estimated gas: ~7 CSPR'}
        </p>
      </div>
    </div>
  );
};
```

## 🧪 Testing Transactions

Create a test utility `src/utils/testTransactions.ts`:

```typescript
import { createDepositDeploy, estimateGas, csprToMotes } from '../services/casper';

/**
 * Test deploy creation without signing
 */
export const testDeployCreation = () => {
  const testPublicKey = '01a1b2c3d4e5f6...'; // Replace with test key
  const amount = csprToMotes('100');

  try {
    const deploy = createDepositDeploy(testPublicKey, amount);
    console.log('✅ Deploy created successfully');
    console.log('Deploy Hash:', deploy.hash);
    console.log('Payment Amount:', estimateGas('deposit'));
    return true;
  } catch (error) {
    console.error('❌ Deploy creation failed:', error);
    return false;
  }
};
```

## 📋 Gas Optimization Tips

### 1. Batch Operations
Instead of multiple small transactions, batch operations when possible:

```typescript
// ❌ Bad: Multiple deposits
await deposit('10');
await deposit('20');
await deposit('30');

// ✅ Good: Single larger deposit
await deposit('60');
```

### 2. Estimate Before Submitting
Always estimate gas to avoid failures:

```typescript
const estimatedGas = estimateGas('deposit');
console.log(`Estimated gas: ${motesToCspr(estimatedGas)} CSPR`);
```

### 3. Handle Insufficient Balance
Check user balance before attempting transactions:

```typescript
const balance = await getAccountBalance(publicKey);
const totalCost = parseFloat(amount) + parseFloat(motesToCspr(estimatedGas));

if (parseFloat(balance) < totalCost) {
  throw new Error('Insufficient balance for transaction + gas');
}
```

## ✅ Checklist

- [ ] Casper transaction service implemented
- [ ] Deposit transaction construction working
- [ ] Withdrawal transaction construction working
- [ ] Transaction signing with CSPR.click integrated
- [ ] Deploy submission to network functional
- [ ] Transaction status monitoring implemented
- [ ] Error handling for failed transactions
- [ ] Gas estimation working correctly
- [ ] UI updates to show transaction status
- [ ] Explorer links for transaction verification

## 🎓 What You've Learned

- Casper's deploy model and structure
- Creating and signing transactions
- Gas estimation and optimization
- Transaction monitoring and status checking
- Error handling for blockchain operations
- Integration between frontend and blockchain

## 📖 Next Steps

With transaction handling complete, you're ready to build the smart contracts that power the yield optimizer!

**Next**: [Part 4 - Writing Smart Contracts with Odra](../04-smart-contracts/README.md)

---

## 💡 Pro Tips

- Always test on testnet before mainnet
- Keep private keys secure (never hardcode)
- Implement retry logic for network failures
- Cache deploy results to avoid redundant queries
- Monitor gas prices for cost optimization
- Use TypeScript for type safety with Casper types

**Previous**: [← Part 2: Frontend](../02-frontend/README.md) | **Next**: [Part 4: Smart Contracts →](../04-smart-contracts/README.md)
