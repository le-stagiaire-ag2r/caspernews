import { useState } from 'react';
import { useClick } from '@make-software/csprclick-ui';
import { useTransaction } from '../hooks/useTransaction';
import { useDeployStatus } from '../hooks/useDeployStatus';
import { estimateGas, motesToCspr } from '../services/casper';

type ActionType = 'deposit' | 'withdraw';

export const ActionPanel = () => {
  const { isConnected } = useClick();
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

    // Clear input on successful submission
    if (!error) {
      setAmount('');
    }
  };

  const handleTabChange = (tab: ActionType) => {
    setActiveTab(tab);
    reset(); // Clear transaction state when switching tabs
  };

  if (!isConnected) {
    return (
      <div className="card text-center">
        <p className="text-gray-400 mb-4">Please connect your wallet to continue</p>
        <p className="text-sm text-gray-500">
          Use the wallet button in the header to connect
        </p>
      </div>
    );
  }

  const gasEstimate = estimateGas(activeTab);
  const gasInCspr = motesToCspr(gasEstimate);

  return (
    <div className="card">
      {/* Tab Selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => handleTabChange('deposit')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'deposit'
              ? 'bg-casper-red text-white'
              : 'bg-casper-gray-light text-gray-400 hover:text-white'
          }`}
          disabled={isLoading}
        >
          Deposit
        </button>
        <button
          onClick={() => handleTabChange('withdraw')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'withdraw'
              ? 'bg-casper-red text-white'
              : 'bg-casper-gray-light text-gray-400 hover:text-white'
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
            className="input"
            step="0.01"
            min="0"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>Available Balance:</span>
          <span className="font-mono">-- CSPR</span>
        </div>

        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>Estimated Gas:</span>
          <span className="font-mono">~{gasInCspr} CSPR</span>
        </div>

        <button
          type="submit"
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            activeTab === 'deposit' ? 'Deposit' : 'Withdraw'
          )}
        </button>
      </form>

      {/* Transaction Status */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
          <button
            onClick={reset}
            className="text-xs text-red-300 hover:text-red-100 mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {deployHash && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <p className="text-blue-400 text-sm font-semibold">
              {deployStatus?.status === 'pending' && '⏳ Transaction Pending'}
              {deployStatus?.status === 'success' && '✅ Transaction Confirmed!'}
              {deployStatus?.status === 'failed' && '❌ Transaction Failed'}
            </p>
            {deployStatus?.status !== 'pending' && (
              <button
                onClick={reset}
                className="text-xs text-blue-300 hover:text-blue-100"
              >
                ✕
              </button>
            )}
          </div>

          {deployStatus?.status === 'pending' && (
            <p className="text-xs text-blue-300 mb-2">
              Waiting for confirmation on the blockchain...
            </p>
          )}

          {deployStatus?.status === 'failed' && deployStatus.errorMessage && (
            <p className="text-xs text-red-300 mb-2">
              Error: {deployStatus.errorMessage}
            </p>
          )}

          {deployStatus?.status === 'success' && deployStatus.cost && (
            <p className="text-xs text-green-300 mb-2">
              Gas Cost: {motesToCspr(deployStatus.cost)} CSPR
            </p>
          )}

          <p className="text-xs text-gray-400 font-mono break-all mb-2">
            Deploy Hash: {deployHash}
          </p>

          <a
            href={`https://testnet.cspr.live/deploy/${deployHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-casper-red hover:underline inline-flex items-center"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-casper-gray-light rounded-lg">
        <p className="text-xs text-gray-400">
          {activeTab === 'deposit'
            ? '💡 Deposits are automatically allocated to the highest-yielding pools'
            : '⚠️ Withdrawals include your proportional share of earned rewards'}
        </p>
      </div>
    </div>
  );
};
