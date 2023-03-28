import {Vault} from "@piiano/testcontainers-vault";
import type {Context} from "mocha";
import {OpenAPI} from "../";


const vault = new Vault({
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: 'none',
  }
});

export const mochaHooks = {

  async beforeAll(this: Context) {
    this.timeout(10000);
    const port = await vault.start();

    OpenAPI.BASE = `http://localhost:${port}`;
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.TOKEN = "pvaultauth";
  },

  async afterAll(this: Context) {
    this.timeout(10000);
    await vault.stop();
  }
};
