import { createProtectedForm, controlForm, Client } from './index';

declare global {
  interface Window {
    pvault: typeof pvault;
  }
}

const pvault = {
  createProtectedForm,
  controlForm,
  Client,
};

// add pvault to global scope so client can use it when it is loaded from CDN.
window.pvault = pvault;
