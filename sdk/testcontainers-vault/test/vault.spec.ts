import { Vault } from "..";
import axios from "axios";
import { describe, it } from "node:test";
import assert from "node:assert";

const testVaultConfig = {
  ...(process.env.VAULT_VERSION ? { version: process.env.VAULT_VERSION } : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: "none",
  },
};

describe("testcontainers-vault", { timeout: 30000 }, function () {
  it("should be able to start and stop vault", async () => {
    const vault = new Vault(testVaultConfig);
    const port = await vault.start();

    // verify that the Vault is started on a random port and not the default
    assert.notEqual(port, 8123);

    const controlStatus = await axios.get(
      `http://localhost:${port}/api/pvlt/1.0/ctl/info/health`,
    );
    const dataStatus = await axios.get(
      `http://localhost:${port}/api/pvlt/1.0/data/info/health`,
    );

    assert.equal(controlStatus.status, 200);
    assert.equal(dataStatus.status, 200);
    assert.deepEqual(controlStatus.data, { status: "pass" });
    assert.deepEqual(dataStatus.data, { status: "pass" });

    await vault.stop();

    await assert.rejects(
      axios.get(`http://localhost:${port}/api/pvlt/1.0/data/info/health`),
    );

    await assert.rejects(
      axios.get(`http://localhost:${port}/api/pvlt/1.0/ctl/info/health`),
    );
  });

  it("should be able to start vault on specific port", async () => {
    const port = 57384;
    const vault = new Vault({ port, ...testVaultConfig });
    const actualPort = await vault.start();

    assert.equal(actualPort, port);

    const controlStatus = await axios.get(
      `http://localhost:${port}/api/pvlt/1.0/ctl/info/health`,
    );
    const dataStatus = await axios.get(
      `http://localhost:${port}/api/pvlt/1.0/data/info/health`,
    );

    assert.equal(controlStatus.status, 200);
    assert.equal(dataStatus.status, 200);
    assert.deepEqual(controlStatus.data, { status: "pass" });
    assert.deepEqual(dataStatus.data, { status: "pass" });

    await vault.stop();
  });

  it("should be able to start vault and exec commands", async () => {
    const vault = new Vault(testVaultConfig);
    await vault.start();

    const { output } = await vault.exec("pvault", "status");
    assert.equal(
      output,
      `
+------+---------+
| data | control |
+------+---------+
| pass | pass    |
+------+---------+
`.trimStart(),
    );

    await vault.stop();
  });

  it("should be able to start vault and exec commands with mount binding", async () => {
    const vault = new Vault({
      ...testVaultConfig,
      bindMounts: [
        {
          source: `${__dirname}/resources`,
          target: "/resources",
          mode: "ro",
        },
      ],
    });
    await vault.start();

    const { exitCode } = await vault.exec(
      "pvault",
      "collection",
      "add",
      "--collection-pvschema",
      "@/resources/test-collection.pvschema",
    );
    assert.equal(exitCode, 0);

    const { output } = await vault.exec(
      "pvault",
      "collection",
      "list",
      "--json",
    );

    assert.equal(JSON.parse(output).length, 1);

    await vault.stop();
  });

  it("should be able to start vault with custom environment variables", async () => {
    const customAdminAPIKey = "customAdminAPIKey";
    const vault = new Vault({
      ...testVaultConfig,
      env: {
        ...testVaultConfig.env,
        PVAULT_SERVICE_ADMIN_API_KEY: customAdminAPIKey,
      },
    });
    const port = await vault.start();

    const callWithKey = (key: string) =>
      axios.get(`http://localhost:${port}/api/pvlt/1.0/system/info/version`, {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

    await assert.rejects(callWithKey("pvaultauth"));
    await assert.doesNotReject(callWithKey(customAdminAPIKey));
  });
});
