import { CsprClickInitOptions, CONTENT_MODE } from '@make-software/csprclick-core-types';

export const clickOptions: CsprClickInitOptions = {
  appName: 'Casper DeFi Yield Optimizer',
  appId: 'casper-defi-yield-optimizer',
  contentMode: CONTENT_MODE.IFRAME,
  providers: ['casper-wallet', 'ledger', 'casper-signer', 'torus-wallet', 'metamask-snap'],
};
