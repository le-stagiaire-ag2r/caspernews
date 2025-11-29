import { useClickRef } from '@make-software/csprclick-ui';

export const Header = () => {
  const clickRef = useClickRef();
  const activeAccount = clickRef?.getActiveAccount();
  const isConnected = !!activeAccount;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = () => {
    clickRef?.signIn();
  };

  const handleDisconnect = () => {
    clickRef?.signOut();
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
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-6 py-2 bg-casper-red hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
