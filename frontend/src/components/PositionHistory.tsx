import { useWallet } from '../hooks/useWallet';

// DEMO TRANSACTION DATA - Replace with real data from backend in Phase 3
const DEMO_TRANSACTIONS = [
  {
    id: '1',
    type: 'deposit',
    amount: '500.00',
    apy: '12.5',
    date: 'Nov 27, 2025',
    status: 'confirmed'
  },
  {
    id: '2',
    type: 'deposit',
    amount: '300.00',
    apy: '13.2',
    date: 'Nov 25, 2025',
    status: 'confirmed'
  },
  {
    id: '3',
    type: 'withdraw',
    amount: '150.00',
    apy: '12.8',
    date: 'Nov 23, 2025',
    status: 'confirmed'
  },
  {
    id: '4',
    type: 'deposit',
    amount: '750.00',
    apy: '11.9',
    date: 'Nov 20, 2025',
    status: 'confirmed'
  },
  {
    id: '5',
    type: 'deposit',
    amount: '200.00',
    apy: '12.1',
    date: 'Nov 18, 2025',
    status: 'confirmed'
  }
];

export const PositionHistory = () => {
  const { isConnected } = useWallet();

  // Using demo data for now - will be replaced with real API calls in Phase 3
  const history = isConnected ? DEMO_TRANSACTIONS : [];

  if (!isConnected) {
    return (
      <div className="card text-center">
        <p className="text-gray-400">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No transactions yet</p>
          <p className="text-sm mt-2">Your deposit and withdrawal history will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Type</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">APY</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                        tx.type === 'deposit'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 font-mono font-semibold">{tx.amount} CSPR</td>
                  <td className="py-4 text-green-400">{tx.apy}%</td>
                  <td className="py-4 text-gray-400">{tx.date}</td>
                  <td className="py-4">
                    <span className="text-green-500 flex items-center gap-1">
                      <span className="text-lg">✓</span> Confirmed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
