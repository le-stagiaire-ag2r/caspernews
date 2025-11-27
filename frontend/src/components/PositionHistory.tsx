import { useClick } from '@make-software/csprclick-ui';

export const PositionHistory = () => {
  const { isConnected } = useClick();

  // TODO: Fetch real history from backend
  const history: any[] = [];

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
              {history.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-700">
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.type === 'deposit'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 font-mono">{tx.amount} CSPR</td>
                  <td className="py-4">{tx.apy}%</td>
                  <td className="py-4 text-gray-400">{tx.date}</td>
                  <td className="py-4">
                    <span className="text-green-500">✓ Confirmed</span>
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
