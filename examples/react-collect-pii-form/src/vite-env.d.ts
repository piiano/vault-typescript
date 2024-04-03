/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VAULT_ENDPOINT: string;
  readonly VITE_VAULT_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
