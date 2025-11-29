import { useState } from 'react';
import { useClickRef } from '@make-software/csprclick-ui';
import { TransactionStatus as CSPRClickTransactionStatus } from '@make-software/csprclick-core-types';
import {
  buildDepositTransaction,
  buildWithdrawTransaction,
} from '../services/casper';

export type TransactionStatus = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error';

export interface TransactionState {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  deployHash: string | null;
}

export const useTransaction = () => {
  const clickRef = useClickRef();
  const activeAccount = clickRef?.getActiveAccount();
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

    if (!clickRef) {
      setState(prev => ({ ...prev, error: 'CSPR.click not initialized' }));
      return null;
    }

    try {
      console.log('🚀 Starting deposit transaction...');
      console.log('Public Key:', activeAccount.public_key);
      console.log('Amount:', amountCspr, 'CSPR');

      setState({ status: 'preparing', isLoading: true, error: null, deployHash: null });

      // Build transaction
      const transaction = buildDepositTransaction(
        activeAccount.public_key.toLowerCase(),
        amountCspr
      );
      console.log('✅ Transaction built');

      setState({ status: 'signing', isLoading: true, error: null, deployHash: null });

      // Define status callback
      const onStatusUpdate = (status: string, data: any) => {
        console.log('📊 Transaction status:', status, data);

        if (status === CSPRClickTransactionStatus.CANCELLED) {
          setState({
            status: 'error',
            isLoading: false,
            error: 'Transaction cancelled by user',
            deployHash: null,
          });
        } else if (status === CSPRClickTransactionStatus.ERROR) {
          setState({
            status: 'error',
            isLoading: false,
            error: data?.error || 'Transaction failed',
            deployHash: null,
          });
        } else if (status === CSPRClickTransactionStatus.SENT) {
          setState({ status: 'submitting', isLoading: true, error: null, deployHash: null });
        } else if (status === CSPRClickTransactionStatus.PROCESSED) {
          if (data.csprCloudTransaction?.error_message === null) {
            setState({
              status: 'success',
              isLoading: false,
              error: null,
              deployHash: data.deployHash || data.transactionHash,
            });
          } else {
            setState({
              status: 'error',
              isLoading: false,
              error: data.csprCloudTransaction?.error_message || 'Transaction failed',
              deployHash: null,
            });
          }
        }
      };

      // Send transaction using CSPR.click
      const result = await clickRef.send(
        transaction,
        activeAccount.public_key.toLowerCase(),
        onStatusUpdate
      );

      if (result?.transactionHash) {
        console.log('✅ Transaction submitted:', result.transactionHash);
        return result.transactionHash;
      } else if (result?.cancelled) {
        return null;
      } else {
        throw new Error(result?.error || 'Transaction failed');
      }
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

    if (!clickRef) {
      setState(prev => ({ ...prev, error: 'CSPR.click not initialized' }));
      return null;
    }

    try {
      console.log('🚀 Starting withdraw transaction...');
      console.log('Public Key:', activeAccount.public_key);
      console.log('Shares:', sharesCspr);

      setState({ status: 'preparing', isLoading: true, error: null, deployHash: null });

      // Build transaction
      const transaction = buildWithdrawTransaction(
        activeAccount.public_key.toLowerCase(),
        sharesCspr
      );
      console.log('✅ Transaction built');

      setState({ status: 'signing', isLoading: true, error: null, deployHash: null });

      // Define status callback
      const onStatusUpdate = (status: string, data: any) => {
        console.log('📊 Transaction status:', status, data);

        if (status === CSPRClickTransactionStatus.CANCELLED) {
          setState({
            status: 'error',
            isLoading: false,
            error: 'Transaction cancelled by user',
            deployHash: null,
          });
        } else if (status === CSPRClickTransactionStatus.ERROR) {
          setState({
            status: 'error',
            isLoading: false,
            error: data?.error || 'Transaction failed',
            deployHash: null,
          });
        } else if (status === CSPRClickTransactionStatus.SENT) {
          setState({ status: 'submitting', isLoading: true, error: null, deployHash: null });
        } else if (status === CSPRClickTransactionStatus.PROCESSED) {
          if (data.csprCloudTransaction?.error_message === null) {
            setState({
              status: 'success',
              isLoading: false,
              error: null,
              deployHash: data.deployHash || data.transactionHash,
            });
          } else {
            setState({
              status: 'error',
              isLoading: false,
              error: data.csprCloudTransaction?.error_message || 'Transaction failed',
              deployHash: null,
            });
          }
        }
      };

      // Send transaction using CSPR.click
      const result = await clickRef.send(
        transaction,
        activeAccount.public_key.toLowerCase(),
        onStatusUpdate
      );

      if (result?.transactionHash) {
        console.log('✅ Transaction submitted:', result.transactionHash);
        return result.transactionHash;
      } else if (result?.cancelled) {
        return null;
      } else {
        throw new Error(result?.error || 'Transaction failed');
      }
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
