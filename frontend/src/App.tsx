import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClickProvider, ClickUI } from '@make-software/csprclick-ui';
import { clickOptions } from './config/csprclick';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActionPanel } from './components/ActionPanel';
import { PositionHistory } from './components/PositionHistory';

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
      <ClickProvider options={clickOptions}>
        <ClickUI />
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
      </ClickProvider>
    </QueryClientProvider>
  );
}

export default App;
