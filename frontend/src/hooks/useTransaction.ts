import { useState } from 'react';
import { useWallet } from './useWallet';
import {
  createDepositDeploy,
  createWithdrawDeploy,
  signAndSubmitDeploy,
} from '../services/casper';

export type TransactionStatus = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error';

export interface TransactionState {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  deployHash: string | null;
}

export const useTransaction = () => {
  const { activeAccount, provider } = useWallet();
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
    if (!activeAccount) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    if (!provider) {
      setState(prev => ({ ...prev, error: 'Wallet provider not available' }));
      return null;
    }

    try {
      console.log('🚀 Starting deposit transaction...');
      console.log('Public Key:', activeAccount.public_key);
      console.log('Amount:', amountCspr, 'CSPR');

      setState({ status: 'preparing', isLoading: true, error: null, deployHash: null });

      // Create deploy
      const deploy = createDepositDeploy(activeAccount.public_key, amountCspr);
      console.log('✅ Deploy created');

      setState({ status: 'signing', isLoading: true, error: null, deployHash: null });

      // Sign and submit
      const deployHash = await signAndSubmitDeploy(deploy, provider);
      console.log('✅ Deploy submitted:', deployHash);

      setState({ status: 'success', isLoading: false, error: null, deployHash });

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
    if (!activeAccount) {
      setState(prev => ({ ...prev, error: 'No wallet connected' }));
      return null;
    }

    if (!provider) {
      setState(prev => ({ ...prev, error: 'Wallet provider not available' }));
      return null;
    }

    try {
      console.log('🚀 Starting withdraw transaction...');
      console.log('Public Key:', activeAccount.public_key);
      console.log('Shares:', sharesCspr);

      setState({ status: 'preparing', isLoading: true, error: null, deployHash: null });

      // Create deploy
      const deploy = createWithdrawDeploy(activeAccount.public_key, sharesCspr);
      console.log('✅ Deploy created');

      setState({ status: 'signing', isLoading: true, error: null, deployHash: null });

      // Sign and submit
      const deployHash = await signAndSubmitDeploy(deploy, provider);
      console.log('✅ Deploy submitted:', deployHash);

      setState({ status: 'success', isLoading: false, error: null, deployHash });

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
