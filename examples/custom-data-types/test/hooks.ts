import {Vault} from "@piiano/testcontainers-vault";
import {VaultClient} from "@piiano/vault-client";
import type {Context} from "mocha";


const vault = new Vault({
  ...(process.env.VAULT_VERSION ? {version: process.env.VAULT_VERSION} : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: 'none',
  }
});

declare module "mocha" {
  export interface Context {
    vaultClient: VaultClient;
  }
}

export const mochaHooks = {

  async beforeAll(this: Context) {
    this.timeout(30000);
    this.slow(25000);
    const port = await vault.start();

    this.vaultClient = new VaultClient({
      vaultURL: `http://localhost:${port}`,
      apiKey: "pvaultauth",
    })
  },

  async afterAll(this: Context) {
    this.timeout(10000);
    await vault.stop();
  }
};
