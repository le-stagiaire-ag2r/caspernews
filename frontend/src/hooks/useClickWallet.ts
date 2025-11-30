import { useState, useEffect } from 'react';
import { useClickRef } from '@make-software/csprclick-ui';

export const useClickWallet = () => {
  const clickRef = useClickRef();
  const [isConnected, setIsConnected] = useState(false);
  const [activePublicKey, setActivePublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check connection status periodically to detect changes
    const checkConnection = async () => {
      if (clickRef) {
        try {
          const publicKey = await clickRef.getActivePublicKey();
          if (publicKey) {
            if (publicKey !== activePublicKey) {
              console.log('✅ Wallet state updated:', publicKey);
              setActivePublicKey(publicKey);
              setIsConnected(true);
            }
          } else {
            // Not connected
            if (isConnected) {
              console.log('🔌 Wallet disconnected');
              setActivePublicKey(null);
              setIsConnected(false);
            }
          }
        } catch (error) {
          // Not connected or error
          if (isConnected) {
            setActivePublicKey(null);
            setIsConnected(false);
          }
        }
      }
    };

    // Check immediately
    checkConnection();

    // Poll every 500ms to detect connection changes
    const interval = setInterval(checkConnection, 500);

    return () => clearInterval(interval);
  }, [clickRef, activePublicKey, isConnected]);

  const connect = async () => {
    if (!clickRef) {
      console.error('CSPR.click not initialized');
      return;
    }

    try {
      setIsLoading(true);
      await clickRef.signIn();
      const publicKey = await clickRef.getActivePublicKey();

      if (publicKey) {
        setActivePublicKey(publicKey);
        setIsConnected(true);
        console.log('✅ Wallet connected:', publicKey);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!clickRef) return;

    try {
      setIsLoading(true);
      await clickRef.signOut();
      setActivePublicKey(null);
      setIsConnected(false);
      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTransaction = async (transaction: any) => {
    if (!clickRef) {
      throw new Error('CSPR.click not initialized');
    }

    if (!isConnected || !activePublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('📤 Sending transaction via CSPR.click...');
      console.log('📋 Transaction being sent:', JSON.stringify(transaction, null, 2));

      // Send with targetPublicKey and sourcePublicKey
      const result = await clickRef.send(JSON.stringify(transaction), activePublicKey);

      console.log('✅ Transaction result:', result);
      console.log('📋 Result keys:', Object.keys(result || {}));
      console.log('📋 Result JSON:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ Failed to send transaction:', error);
      throw error;
    }
  };

  return {
    isConnected,
    activePublicKey,
    isLoading,
    connect,
    disconnect,
    sendTransaction,
  };
};
