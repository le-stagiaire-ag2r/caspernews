import { useClick } from '@make-software/csprclick-ui';

export const Header = () => {
  const { activeAccount, isConnected } = useClick();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-casper-gray border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-casper-red rounded-full flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            DeFi Yield <span className="text-casper-red">Optimizer</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected && activeAccount ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-400">Connected: </span>
                <span className="font-mono text-white">
                  {formatAddress(activeAccount.public_key)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Connect your wallet to get started
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
