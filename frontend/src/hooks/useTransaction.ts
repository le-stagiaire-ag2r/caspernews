import { useState } from 'react';
import { useClickWallet } from './useClickWallet';
import {
  createDepositTransaction,
  createWithdrawTransaction,
} from '../services/casper';

export type TransactionStatus = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error';

export interface TransactionState {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  deployHash: string | null;
}

export const useTransaction = () => {
  const { activePublicKey, sendTransaction } = useClickWallet();
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    isLoading: false,
    error: null,
    deployHash: null,
  });

  /**
   * Execute a deposit transaction
   */
  const deposit = async (amountCspr: string) => {
    if (!activePublicKey) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    try {
      console.log('🚀 Starting deposit transaction...');
      console.log('Public Key:', activePublicKey);
      console.log('Amount:', amountCspr, 'CSPR');

      setState({ status: 'preparing', isLoading: true, error: null, deployHash: null });

      // Create transaction using ContractCallBuilder
      const transaction = createDepositTransaction(activePublicKey, amountCspr);
      console.log('✅ Transaction created');

      setState({ status: 'signing', isLoading: true, error: null, deployHash: null });

      // Send via CSPR.click
      setState({ status: 'submitting', isLoading: true, error: null, deployHash: null });
      const result = await sendTransaction(transaction);

      const deployHash = result?.deployHash;
      console.log('✅ Transaction processed:', deployHash);

      setState({ status: 'success', isLoading: false, error: null, deployHash: deployHash || null });

      return deployHash;
    } catch (error: any) {
      console.error('❌ Deposit failed:', error);
      setState({
        status: 'error',
        isLoading: false,
        error: error.message || 'Deposit transaction failed',
        deployHash: null,
      });
      return null;
    }
  };

  /**
   * Execute a withdrawal transaction
   */
  const withdraw = async (sharesCspr: string) => {
    if (!activePublicKey) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    try {
      console.log('🚀 Starting withdraw transaction...');
      console.log('Public Key:', activePublicKey);
      console.log('Shares:', sharesCspr);

      setState({ status: 'preparing', isLoading: true, error: null, deployHash: null });

      // Create transaction using ContractCallBuilder
      const transaction = createWithdrawTransaction(activePublicKey, sharesCspr);
      console.log('✅ Transaction created');

      setState({ status: 'signing', isLoading: true, error: null, deployHash: null });

      // Send via CSPR.click
      setState({ status: 'submitting', isLoading: true, error: null, deployHash: null });
      const result = await sendTransaction(transaction);

      const deployHash = result?.deployHash;
      console.log('✅ Transaction processed:', deployHash);

      setState({ status: 'success', isLoading: false, error: null, deployHash: deployHash || null });

      return deployHash;
    } catch (error: any) {
      console.error('❌ Withdraw failed:', error);
      setState({
        status: 'error',
        isLoading: false,
        error: error.message || 'Withdraw transaction failed',
        deployHash: null,
      });
      return null;
    }
  };

  /**
   * Reset transaction state
   */
  const reset = () => {
    setState({
      status: 'idle',
      isLoading: false,
      error: null,
      deployHash: null,
    });
  };

  return {
    ...state,
    deposit,
    withdraw,
    reset,
  };
};
