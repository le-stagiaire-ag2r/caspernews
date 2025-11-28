import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const WALLET_STORAGE_KEY = 'casper_wallet_disconnected';

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

          // Clear disconnected flag when successfully connected
          localStorage.removeItem(WALLET_STORAGE_KEY);

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

          // Clear disconnected flag when successfully connected
          localStorage.removeItem(WALLET_STORAGE_KEY);

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
    console.log('🔌 Disconnecting wallet...');

    // Call disconnect method on provider if available
    if (provider) {
      try {
        if (typeof provider.disconnect === 'function') {
          provider.disconnect();
          console.log('✅ Called provider.disconnect()');
        } else if (typeof provider.disconnectFromSite === 'function') {
          provider.disconnectFromSite();
          console.log('✅ Called provider.disconnectFromSite()');
        }
      } catch (error) {
        console.warn('⚠️ Error calling provider disconnect:', error);
      }
    }

    // Set localStorage flag to prevent auto-reconnect
    localStorage.setItem(WALLET_STORAGE_KEY, 'true');

    // Clear state
    setActiveAccount(null);
    setIsConnected(false);
    setProvider(null);

    console.log('✅ Wallet disconnected - will not auto-reconnect');
  };

  // Check on mount and handle wallet events
  useEffect(() => {
    const checkAndHandleWalletState = async () => {
      const wasDisconnected = localStorage.getItem(WALLET_STORAGE_KEY);

      // Try Casper Wallet
      if (typeof window.CasperWalletProvider !== 'undefined') {
        const walletProvider = window.CasperWalletProvider();

        try {
          // Check if wallet is already connected
          const isWalletConnected = await walletProvider.isConnected();
          console.log('🔍 Wallet connection state on mount:', isWalletConnected);

          if (isWalletConnected && wasDisconnected) {
            // User disconnected but wallet auto-reconnected - force disconnect
            console.log('⚠️ Forcing wallet disconnect - user previously disconnected');
            try {
              if (typeof walletProvider.disconnect === 'function') {
                await walletProvider.disconnect();
              } else if (typeof walletProvider.disconnectFromSite === 'function') {
                await walletProvider.disconnectFromSite();
              }
            } catch (err) {
              console.warn('Could not force disconnect:', err);
            }
            return;
          }

          if (isWalletConnected && !wasDisconnected) {
            // Wallet is connected and user didn't disconnect - restore state
            console.log('✅ Restoring wallet connection from previous session');
            const publicKey = await walletProvider.getActivePublicKey();
            if (publicKey) {
              setActiveAccount({ public_key: publicKey });
              setIsConnected(true);
              setProvider(walletProvider);
            }
          }
        } catch (error) {
          console.log('ℹ️ Wallet not connected:', error);
        }
      }

      // Try Casper Signer
      if (typeof window.casperlabsHelper !== 'undefined') {
        try {
          const isSignerConnected = await window.casperlabsHelper.isConnected();
          console.log('🔍 Signer connection state on mount:', isSignerConnected);

          if (isSignerConnected && wasDisconnected) {
            console.log('⚠️ Forcing signer disconnect - user previously disconnected');
            try {
              if (typeof window.casperlabsHelper.disconnect === 'function') {
                await window.casperlabsHelper.disconnect();
              }
            } catch (err) {
              console.warn('Could not force disconnect:', err);
            }
            return;
          }

          if (isSignerConnected && !wasDisconnected) {
            console.log('✅ Restoring signer connection from previous session');
            const publicKey = await window.casperlabsHelper.getActivePublicKey();
            if (publicKey) {
              setActiveAccount({ public_key: publicKey });
              setIsConnected(true);
              setProvider(window.casperlabsHelper);
            }
          }
        } catch (error) {
          console.log('ℹ️ Signer not connected:', error);
        }
      }
    };

    // Small delay to let wallet extension initialize
    const timer = setTimeout(checkAndHandleWalletState, 500);
    return () => clearTimeout(timer);
  }, []);

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
