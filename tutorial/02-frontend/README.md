# Part 2: Building the Frontend with CSPR.click and React

In this part, you'll build a modern React application with wallet integration using CSPR.click. You'll create the user interface for deposits, withdrawals, and real-time yield tracking.

## 📖 What You'll Learn

- Setting up a React project with Vite and TypeScript
- Integrating CSPR.click for wallet connectivity
- Building UI components for DeFi interactions
- Managing application state and user authentication
- Implementing responsive design with TailwindCSS

## 🚀 Getting Started

### Project Initialization

1. **Navigate to the frontend directory**
```bash
cd frontend
```

2. **Initialize React project with Vite**
```bash
npm create vite@latest . -- --template react-ts
```

3. **Install dependencies**
```bash
npm install
```

4. **Install CSPR.click SDK**
```bash
npm install @make-software/csprclick-ui @make-software/csprclick-core
```

5. **Install additional dependencies**
```bash
npm install @tanstack/react-query axios recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 🔧 Project Configuration

### TailwindCSS Setup

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        casper: {
          red: '#FF0011',
          dark: '#1A1A1A',
          gray: '#2D2D2D',
        }
      }
    },
  },
  plugins: [],
}
```

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-casper-dark text-white;
  }
}
```

### TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🔌 Integrating CSPR.click

### Wallet Provider Setup

Create `src/providers/WalletProvider.tsx`:

```typescript
import { ClickProvider, ClickUI } from '@make-software/csprclick-ui';
import { ReactNode } from 'react';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  return (
    <ClickProvider>
      <ClickUI />
      {children}
    </ClickProvider>
  );
};
```

### Wallet Connection Hook

Create `src/hooks/useWallet.ts`:

```typescript
import { useClick } from '@make-software/csprclick-ui';
import { useCallback } from 'react';

export const useWallet = () => {
  const {
    activeAccount,
    isConnected,
    connect,
    disconnect
  } = useClick();

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [disconnect]);

  return {
    account: activeAccount,
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
};
```

## 🎨 Building UI Components

### Navigation Header

Create `src/components/Header.tsx`:

```typescript
import { useWallet } from '../hooks/useWallet';

export const Header = () => {
  const { account, isConnected, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-casper-gray border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-casper-red">
            Casper DeFi Optimizer
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected && account ? (
            <>
              <div className="text-sm">
                <span className="text-gray-400">Connected: </span>
                <span className="font-mono">{formatAddress(account.public_key)}</span>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              className="px-6 py-2 bg-casper-red hover:bg-red-700 rounded-lg transition font-semibold"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
```

### Dashboard Overview

Create `src/components/Dashboard.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchPoolStats } from '../services/api';

export const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['poolStats'],
    queryFn: fetchPoolStats,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        label="Total Value Locked"
        value={`${stats?.tvl || 0} CSPR`}
        trend="+12.5%"
      />
      <StatCard
        label="Average APY"
        value={`${stats?.avgApy || 0}%`}
        trend="+2.3%"
      />
      <StatCard
        label="Your Position"
        value={`${stats?.userPosition || 0} CSPR`}
        trend="+5.1%"
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
}

const StatCard = ({ label, value, trend }: StatCardProps) => {
  const isPositive = trend.startsWith('+');

  return (
    <div className="bg-casper-gray rounded-lg p-6 border border-gray-700">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {trend} <span className="text-gray-500">24h</span>
      </div>
    </div>
  );
};
```

### Deposit/Withdraw Component

Create `src/components/ActionPanel.tsx`:

```typescript
import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

type ActionType = 'deposit' | 'withdraw';

export const ActionPanel = () => {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<ActionType>('deposit');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Transaction logic will be implemented in Part 3
    console.log(`${activeTab} ${amount} CSPR`);
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
          />
        </div>

        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>Available Balance:</span>
          <span className="font-mono">1,000.00 CSPR</span>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-casper-red hover:bg-red-700 rounded-lg font-semibold transition"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          {activeTab === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-400">
          {activeTab === 'deposit'
            ? '💡 Deposits are automatically allocated to the highest-yielding pools'
            : '⚠️ Withdrawals include your proportional share of earned rewards'}
        </p>
      </div>
    </div>
  );
};
```

### Position History

Create `src/components/PositionHistory.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchUserHistory } from '../services/api';
import { useWallet } from '../hooks/useWallet';

export const PositionHistory = () => {
  const { account } = useWallet();

  const { data: history, isLoading } = useQuery({
    queryKey: ['userHistory', account?.public_key],
    queryFn: () => fetchUserHistory(account?.public_key || ''),
    enabled: !!account,
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  return (
    <div className="bg-casper-gray rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>

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
            {history?.map((tx: any) => (
              <tr key={tx.id} className="border-b border-gray-700">
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tx.type === 'deposit' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
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
    </div>
  );
};
```

## 🔌 API Service Layer

Create `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PoolStats {
  tvl: number;
  avgApy: number;
  userPosition: number;
}

export interface UserHistory {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: string;
  apy: number;
  date: string;
}

export const fetchPoolStats = async (): Promise<PoolStats> => {
  const { data } = await api.get('/stats');
  return data;
};

export const fetchUserHistory = async (publicKey: string): Promise<UserHistory[]> => {
  const { data } = await api.get(`/history/${publicKey}`);
  return data;
};

export const getAccountBalance = async (publicKey: string): Promise<string> => {
  const { data } = await api.get(`/balance/${publicKey}`);
  return data.balance;
};
```

## 🎯 Main Application

Update `src/App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './providers/WalletProvider';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActionPanel } from './components/ActionPanel';
import { PositionHistory } from './components/PositionHistory';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
        </div>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## 🌐 Environment Variables

Create `.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_CASPER_NETWORK=casper-test
VITE_CONTRACT_HASH=hash-xxxxx
```

## 🚀 Running the Frontend

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## ✅ Checklist

- [ ] Project initialized with Vite and TypeScript
- [ ] CSPR.click integrated for wallet connection
- [ ] TailwindCSS configured and styled
- [ ] Header with wallet connection UI
- [ ] Dashboard with TVL and APY statistics
- [ ] Deposit/Withdraw action panel
- [ ] Transaction history table
- [ ] API service layer configured
- [ ] Environment variables set up
- [ ] Application runs without errors

## 🎓 What You've Learned

- Setting up a modern React application with TypeScript
- Integrating CSPR.click for multi-wallet support
- Building responsive DeFi UI components
- Managing state with React Query
- Structuring a scalable frontend architecture

## 📖 Next Steps

Now that you have a functional frontend with wallet integration, you're ready to learn how to construct and sign Casper transactions!

**Next**: [Part 3 - Constructing and Signing Casper Transactions](../03-transactions/README.md)

---

## 💡 Tips

- Use React DevTools to debug component state
- Test wallet connection with different wallet providers
- Implement error boundaries for production apps
- Consider adding loading skeletons for better UX
- Use TypeScript strictly for type safety

**Previous**: [← Part 1: Introduction](../01-introduction/README.md) | **Next**: [Part 3: Transactions →](../03-transactions/README.md)
