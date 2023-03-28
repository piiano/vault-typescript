import {SystemService} from "../";
import {expect} from "chai";

describe('system',  function () {

  it('check vault health', async function () {
    const dataHealth = await SystemService.dataHealth()
    const controlHealth = await SystemService.controlHealth()

    expect(dataHealth.status).to.equal("pass")
    expect(controlHealth.status).to.equal("pass")
  });

  it('get vault version', async function () {
    const version = await SystemService.getVaultVersion()

    expect(version).to.have.property("vault_id")
    expect(version).to.have.property("vault_version")
    expect(version).to.have.property("db_schema_version")
  });

});