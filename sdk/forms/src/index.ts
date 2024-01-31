import { createProtectedForm } from './protected-forms';
import { controlForm } from './controlled-forms';
import { VaultClient as Client } from '@piiano/vault-client';

declare global {
  interface Window {
    pvault: typeof pvault;
  }
}

export const pvault = {
  createProtectedForm,
  controlForm,
  Client,
};

// add pvault to global scope so client can configure use it.
window.pvault = pvault;
