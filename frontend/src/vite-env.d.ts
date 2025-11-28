/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CASPER_NETWORK: string;
  readonly VITE_CONTRACT_HASH: string;
  readonly VITE_CASPER_RPC_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
