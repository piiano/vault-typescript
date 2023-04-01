import {expect} from "chai";

describe('system',  function () {

  it('check vault health', async function () {
    const dataHealth = await this.vaultClient.system.dataHealth()
    const controlHealth = await this.vaultClient.system.controlHealth()

    expect(dataHealth.status).to.equal("pass")
    expect(controlHealth.status).to.equal("pass")
  });

  it('get vault version', async function () {
    const version = await this.vaultClient.system.getVaultVersion()

    expect(version).to.have.property("vault_id")
    expect(version).to.have.property("vault_version")
    expect(version).to.have.property("db_schema_version")
  });

});

