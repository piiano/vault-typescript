import { createProtectedForm, createProtectedView, controlForm, Client } from './index';

declare global {
  interface Window {
    pvault: typeof pvault;
  }
}

const pvault = {
  createProtectedForm,
  createProtectedView,
  controlForm,
  Client,
};

// add pvault to global scope so client can use it when it is loaded from CDN.
window.pvault = pvault;
