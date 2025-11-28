import { useEffect, useState } from 'react';
import { useClickRef } from '@make-software/csprclick-ui';

export interface WalletAccount {
  public_key: string;
  name?: string;
}

export const useWallet = () => {
  const clickRef = useClickRef();
  const [activeAccount, setActiveAccount] = useState<WalletAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (!clickRef) return;

    const handleSignedIn = (evt: any) => {
      if (evt.detail?.account) {
        setActiveAccount({
          public_key: evt.detail.account.public_key,
          name: evt.detail.account.name,
        });
        setIsConnected(true);
      }
    };

    const handleSwitchedAccount = (evt: any) => {
      if (evt.detail?.account) {
        setActiveAccount({
          public_key: evt.detail.account.public_key,
          name: evt.detail.account.name,
        });
      }
    };

    const handleSignedOut = () => {
      setActiveAccount(null);
      setIsConnected(false);
    };

    clickRef.on('csprclick:signed_in', handleSignedIn);
    clickRef.on('csprclick:switched_account', handleSwitchedAccount);
    clickRef.on('csprclick:signed_out', handleSignedOut);

    return () => {
      clickRef.off('csprclick:signed_in', handleSignedIn);
      clickRef.off('csprclick:switched_account', handleSwitchedAccount);
      clickRef.off('csprclick:signed_out', handleSignedOut);
    };
  }, [clickRef]);

  // Direct wallet connection (fallback if clickRef doesn't work)
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

  return {
    clickRef,
    activeAccount,
    isConnected,
    provider,
    connectDirectWallet,
    disconnectDirectWallet,
  };
};

// Type declarations for window
declare global {
  interface Window {
    CasperWalletProvider?: any;
    casperlabsHelper?: any;
  }
}
