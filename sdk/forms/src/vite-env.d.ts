/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IFRAME_URL: string;
  readonly VITE_IFRAME_ORIGIN: string;
  readonly VITE_VAULT_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
