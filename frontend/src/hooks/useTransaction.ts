import { useState } from 'react';
import { useClick } from '@make-software/csprclick-ui';
import {
  createDepositDeploy,
  createWithdrawDeploy,
  csprToMotes,
  submitDeploy,
} from '../services/casper';
import { DeployUtil } from 'casper-js-sdk';

export interface TransactionState {
  isLoading: boolean;
  error: string | null;
  deployHash: string | null;
}

export const useTransaction = () => {
  const { activeAccount, signDeploy } = useClick();
  const [state, setState] = useState<TransactionState>({
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

    setState({ isLoading: true, error: null, deployHash: null });

    try {
      // Convert CSPR to motes
      const amountMotes = csprToMotes(amountCspr);

      console.log('Creating deposit deploy:', {
        publicKey: activeAccount.public_key,
        amountCspr,
        amountMotes,
      });

      // Create the deploy
      const deploy = createDepositDeploy(
        activeAccount.public_key,
        amountMotes,
      );

      console.log('Deploy created, requesting signature...');

      // Sign the deploy with connected wallet
      const signedDeploy = await signDeploy(deploy);

      if (!signedDeploy) {
        throw new Error('User rejected transaction');
      }

      console.log('Deploy signed, submitting to network...');

      // Submit to the network
      const deployHash = await submitDeploy(signedDeploy as unknown as DeployUtil.Deploy);

      console.log('Deploy submitted successfully:', deployHash);

      setState({
        isLoading: false,
        error: null,
        deployHash,
      });

      return deployHash;
    } catch (error: any) {
      console.error('Deposit failed:', error);
      setState({
        isLoading: false,
        error: error.message || 'Transaction failed',
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

    setState({ isLoading: true, error: null, deployHash: null });

    try {
      // Convert CSPR to motes for shares
      const sharesMotes = csprToMotes(sharesCspr);

      console.log('Creating withdraw deploy:', {
        publicKey: activeAccount.public_key,
        sharesCspr,
        sharesMotes,
      });

      const deploy = createWithdrawDeploy(
        activeAccount.public_key,
        sharesMotes,
      );

      console.log('Deploy created, requesting signature...');

      const signedDeploy = await signDeploy(deploy);

      if (!signedDeploy) {
        throw new Error('User rejected transaction');
      }

      console.log('Deploy signed, submitting to network...');

      const deployHash = await submitDeploy(signedDeploy as unknown as DeployUtil.Deploy);

      console.log('Deploy submitted successfully:', deployHash);

      setState({
        isLoading: false,
        error: null,
        deployHash,
      });

      return deployHash;
    } catch (error: any) {
      console.error('Withdraw failed:', error);
      setState({
        isLoading: false,
        error: error.message || 'Transaction failed',
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
