import { createProtectedForm } from './protected-forms';
import { controlForm } from './controlled-forms';

declare global {
  interface Window {
    pvault: typeof pvault;
  }
}

export const pvault = {
  createProtectedForm,
  controlForm,
};

// add pvault to global scope so client can configure use it.
window.pvault = pvault;
