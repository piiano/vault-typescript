import { before, describe, it } from "node:test";
import assert from "node:assert";
import { VaultClient } from "..";

describe("system", function () {
  let vaultClient: VaultClient;
  before(() => {
    vaultClient = new VaultClient({ vaultURL: process.env.VAULT_URL });
  });

  it("check vault health", async function (t) {
    const dataHealth = await vaultClient.system.dataHealth();
    const controlHealth = await vaultClient.system.controlHealth();

    assert.equal(dataHealth.status, "pass");
    assert.equal(controlHealth.status, "pass");
  });

  it("get vault version", async function (t) {
    const version = await vaultClient.system.getVaultVersion();

    assert.ok("vault_id" in version);
    assert.ok("vault_version" in version);
    assert.ok("db_schema_version" in version);
  });
});
