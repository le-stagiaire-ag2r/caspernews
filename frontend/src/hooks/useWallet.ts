import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface WalletAccount {
  public_key: string;
  name?: string;
}

interface WalletContextType {
  activeAccount: WalletAccount | null;
  isConnected: boolean;
  provider: any;
  connectDirectWallet: () => Promise<boolean>;
  disconnectDirectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [activeAccount, setActiveAccount] = useState<WalletAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  // Direct wallet connection using native Casper wallet providers
  const connectDirectWallet = async () => {
    try {
      console.log('🔍 Attempting wallet connection...');
      console.log('CasperWalletProvider available?', typeof window.CasperWalletProvider !== 'undefined');
      console.log('casperlabsHelper available?', typeof window.casperlabsHelper !== 'undefined');

      // Try Casper Wallet
      if (typeof window.CasperWalletProvider !== 'undefined') {
        console.log('✅ Casper Wallet detected, requesting connection...');
        const walletProvider = window.CasperWalletProvider();
        const connected = await walletProvider.requestConnection();
        console.log('Connection result:', connected);

        if (connected) {
          const publicKey = await walletProvider.getActivePublicKey();
          console.log('✅ Public key received:', publicKey);

          setActiveAccount({ public_key: publicKey });
          setIsConnected(true);
          setProvider(walletProvider);

          console.log('✅ Wallet state updated - isConnected: true');
          return true;
        }
      }

      // Try Casper Signer
      if (typeof window.casperlabsHelper !== 'undefined') {
        console.log('✅ Casper Signer detected, requesting connection...');
        const publicKey = await window.casperlabsHelper.requestConnection();
        console.log('Public key received:', publicKey);

        if (publicKey) {
          setActiveAccount({ public_key: publicKey });
          setIsConnected(true);
          setProvider(window.casperlabsHelper);

          console.log('✅ Wallet state updated - isConnected: true');
          return true;
        }
      }

      console.error('❌ No wallet provider found');
      throw new Error('No Casper wallet detected. Please install Casper Wallet extension.');
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      return false;
    }
  };

  const disconnectDirectWallet = () => {
    setActiveAccount(null);
    setIsConnected(false);
    setProvider(null);
  };

  const value = {
    activeAccount,
    isConnected,
    provider,
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

// Type declarations for window
declare global {
  interface Window {
    CasperWalletProvider?: any;
    casperlabsHelper?: any;
  }
}
