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

  return {
    clickRef,
    activeAccount,
    isConnected,
  };
};
