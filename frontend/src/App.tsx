import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClickProvider } from '@make-software/csprclick-ui';
import { WalletProvider } from './hooks/useWallet';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActionPanel } from './components/ActionPanel';
import { PositionHistory } from './components/PositionHistory';

const CSPR_CLICK_APP_ID = import.meta.env.VITE_CSPR_CLICK_APP_ID || '4f5baf79-a4d3-4efc-b778-eea95fae';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClickProvider appId={CSPR_CLICK_APP_ID}>
        <WalletProvider>
          <div className="min-h-screen bg-casper-dark">
          <Header />

          <main className="container mx-auto px-4 py-8">
            <Dashboard />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-1">
                <ActionPanel />
              </div>

              <div className="lg:col-span-2">
                <PositionHistory />
              </div>
            </div>
          </main>

          <footer className="border-t border-gray-700 py-6 mt-12">
            <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
              <p>Built on Casper Network Testnet v2.1.0</p>
              <p className="mt-2">
                DeFi Yield Optimizer - Automated yield farming strategies
              </p>
            </div>
          </footer>
          </div>
        </WalletProvider>
      </ClickProvider>
    </QueryClientProvider>
  );
}

export default App;
