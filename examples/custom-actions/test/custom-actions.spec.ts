import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Vault } from "@piiano/testcontainers-vault";
import { VaultClient } from "@piiano/vault-client";
import { createServer } from "node:http";
import { before, after, describe, it } from "node:test";
import assert from "node:assert";

const mockMailServer = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/send-email") {
    req.on("data", (chunk) => console.log(JSON.parse(chunk)));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ sent: true }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const vault = new Vault({
  ...(process.env.VAULT_VERSION ? { version: process.env.VAULT_VERSION } : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: "none",
    PVAULT_SERVICE_ALLOWED_PCI_HTTP_DESTINATIONS:
      "http://host.docker.internal:3000",
  },
});

let vaultClient: VaultClient;

describe("custom actions", function () {
  before(
    async () => {
      mockMailServer.listen(3000);
      vaultClient = new VaultClient({
        vaultURL: `http://localhost:${await vault.start()}`,
      });
    },
    { timeout: 30000 },
  );

  after(
    async () => {
      await vault.stop();
      mockMailServer.close();
    },
    { timeout: 10000 },
  );

  it("create bundle and custom action and use it", async function () {
    const bundleCode = await readFile(resolve(__dirname, "../dist/index.js"));
    const bundle = await vaultClient.bundles.addBundle({
      requestBody: {
        name: "emails",
        description: "Functions for sending emails",
        code: bundleCode.toString("base64"),
      },
    });

    assert.ok(bundle);
    assert.ok(bundle.exports?.actions);
    assert.equal(bundle.exports?.actions.length, 1);
    assert.equal(bundle.exports?.actions[0]?.name, "send_welcome_email");
    assert.equal(bundle.exports?.actions[0]?.type, "action");

    await vaultClient.actions.addAction({
      requestBody: {
        name: "send_welcome_email",
        function: "emails.send_welcome_email",
        description: "Send welcome email to user",
        role: "VaultAdminRole", // used as example only. In production, use a role with the minimum required permissions for the action.
      },
    });

    await vaultClient.collections.addCollection({
      requestBody: {
        name: "users",
        type: "PERSONS",
        properties: [
          { name: "name", data_type_name: "NAME" },
          { name: "email", data_type_name: "EMAIL" },
        ],
      },
    });

    const testUser = {
      name: "Alice",
      email: "alice@example.com",
    };

    const { id } = await vaultClient.objects.addObject({
      collection: "users",
      reason: "AppFunctionality",
      requestBody: testUser,
    });
    assert.equal(typeof id, "string");

    // Read SSN with and without transformations
    const result = await vaultClient.actions.invokeAction({
      action: "send_welcome_email",
      reason: "AppFunctionality",
      requestBody: { user_id: id },
    });

    assert.deepEqual(result, { ok: true, sent: true });
  });
});
