import { CONTENT_MODE } from '@make-software/csprclick-core-types';

// CSPR.click configuration with console.cspr.build credentials
export const clickOptions = {
  appName: 'Casper DeFi Yield Optimizer',
  appId: '4f5baf79-a4d3-4efc-b778-eea95fae', // From console.cspr.build
  contentMode: CONTENT_MODE.IFRAME,
  providers: ['casper-wallet', 'ledger', 'casper-signer'],
};
