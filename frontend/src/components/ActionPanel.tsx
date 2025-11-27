import { useState } from 'react';
import { useClick } from '@make-software/csprclick-ui';

type ActionType = 'deposit' | 'withdraw';

export const ActionPanel = () => {
  const { isConnected } = useClick();
  const [activeTab, setActiveTab] = useState<ActionType>('deposit');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement transaction logic
    console.log(`${activeTab} ${amount} CSPR`);
  };

  if (!isConnected) {
    return (
      <div className="card text-center">
        <p className="text-gray-400">Please connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Tab Selector */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'deposit'
              ? 'bg-casper-red text-white'
              : 'bg-casper-gray-light text-gray-400 hover:text-white'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 rounded-lg transition ${
            activeTab === 'withdraw'
              ? 'bg-casper-red text-white'
              : 'bg-casper-gray-light text-gray-400 hover:text-white'
          }`}
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
          />
        </div>

        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>Available Balance:</span>
          <span className="font-mono">0.00 CSPR</span>
        </div>

        <button
          type="submit"
          className="w-full btn-primary"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </form>

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
