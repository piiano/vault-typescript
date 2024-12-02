import { Vault } from "@piiano/testcontainers-vault";
import { after, before } from "node:test";

const vault = new Vault({
  ...(process.env.VAULT_VERSION ? { version: process.env.VAULT_VERSION } : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: "none",
  },
});

before(
  async () => {
    process.env.VAULT_URL = `http://localhost:${await vault.start()}`;
  },
  { timeout: 30000 },
);

after(() => vault.stop(), { timeout: 10000 });
