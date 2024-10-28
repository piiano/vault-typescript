import {Vault} from "@piiano/testcontainers-vault";
import {VaultClient} from "@piiano/vault-client";
import type {Context} from "mocha";
import {createServer} from "node:http";

const mockMailServer = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/send-email') {
    req.on('data', chunk => console.log(JSON.parse(chunk)));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sent: true }));
  } else {
    res.writeHead(404);
    res.end();
  }
})

const vault = new Vault({
  ...(process.env.VAULT_VERSION ? {version: process.env.VAULT_VERSION} : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: 'none',
    PVAULT_SERVICE_ALLOWED_HTTP_DESTINATIONS: 'http://host.docker.internal:3000',
    PVAULT_SERVICE_ALLOWED_PCI_HTTP_DESTINATIONS: 'http://host.docker.internal:3000',
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

    mockMailServer.listen(3000);

    const port = await vault.start();

    this.vaultClient = new VaultClient({
      vaultURL: `http://localhost:${port}`,
      apiKey: "pvaultauth",
    })
  },

  async afterAll(this: Context) {
    this.timeout(10000);
    await vault.stop();
    mockMailServer.close();
  }
};
