import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PoolStats {
  tvl: string;
  avgApy: number;
  totalUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
}

export interface UserTransaction {
  id: number;
  deploy_hash: string;
  user_address: string;
  type: 'deposit' | 'withdraw' | 'rebalance';
  amount: string;
  shares?: string;
  timestamp: string;
  block_hash?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface UserPosition {
  user_address: string;
  total_shares: string;
  total_deposited: string;
  last_update: string;
}

/**
 * Fetch overall pool statistics
 */
export const fetchPoolStats = async (): Promise<PoolStats> => {
  const { data } = await api.get('/stats');
  return data;
};

/**
 * Fetch transaction history for a user
 */
export const fetchUserHistory = async (
  publicKey: string,
  limit: number = 50
): Promise<UserTransaction[]> => {
  const { data } = await api.get(`/history/${publicKey}`, {
    params: { limit },
  });
  return data;
};

/**
 * Fetch user position details
 */
export const fetchUserPosition = async (publicKey: string): Promise<UserPosition> => {
  const { data } = await api.get(`/position/${publicKey}`);
  return data;
};

/**
 * Fetch recent transactions across all users
 */
export const fetchRecentTransactions = async (limit: number = 50): Promise<UserTransaction[]> => {
  const { data } = await api.get('/transactions/recent', {
    params: { limit },
  });
  return data;
};

/**
 * Trigger statistics refresh
 */
export const refreshStats = async (): Promise<PoolStats> => {
  const { data } = await api.post('/stats/refresh');
  return data.stats;
};

/**
 * Get account balance (from Casper RPC)
 */
export const getAccountBalance = async (publicKey: string): Promise<string> => {
  // This would typically call Casper RPC to get balance
  // For now, returning placeholder
  // TODO: Implement real balance fetching
  return '0';
};
