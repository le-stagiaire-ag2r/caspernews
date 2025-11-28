import { CONTENT_MODE } from '@make-software/csprclick-core-types';

// CSPR.click configuration for v1.12.0
export const clickOptions = {
  appName: 'Casper DeFi Yield Optimizer',
  appId: 'casper-defi-yield-optimizer',
  contentMode: CONTENT_MODE.IFRAME,
  providers: ['casper-wallet', 'ledger', 'casper-signer'],
};
