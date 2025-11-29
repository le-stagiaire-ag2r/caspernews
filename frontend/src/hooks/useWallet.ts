import React, { createContext, useContext, ReactNode } from 'react';
import { useClickWallet } from './useClickWallet';

export interface WalletAccount {
  public_key: string;
  name?: string;
}

interface WalletContextType {
  activeAccount: WalletAccount | null;
  isConnected: boolean;
  provider: any; // Deprecated - CSPR.click handles this
  connectDirectWallet: () => Promise<boolean>;
  disconnectDirectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, activePublicKey, connect, disconnect } = useClickWallet();

  // Compatibility layer for old API
  const connectDirectWallet = async () => {
    try {
      await connect();
      return true;
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      return false;
    }
  };

  const disconnectDirectWallet = () => {
    disconnect();
  };

  // Create activeAccount in old format
  const activeAccount: WalletAccount | null = activePublicKey
    ? { public_key: activePublicKey }
    : null;

  const value = {
    activeAccount,
    isConnected,
    provider: null, // CSPR.click handles provider internally
    connectDirectWallet,
    disconnectDirectWallet,
  };

  return React.createElement(WalletContext.Provider, { value }, children);
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
