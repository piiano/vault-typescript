import {expect, use} from 'chai'
import {Vault} from "../";
import axios from "axios";
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised)
const testEnv = {
  PVAULT_SENTRY_ENABLE: false,
  PVAULT_LOG_DATADOG_ENABLE: 'none',
}

describe('testcontainers-vault', function () {
  // Long timeout to allow for the image to be pulled
  this.slow(25000)
  this.timeout(30000)

  it('should be able to start and stop vault', async () => {
    const vault = new Vault({ env: testEnv })
    const port = await vault.start()

    // verify that the Vault is started on a random port and not the default
    expect(port).to.not.equal(8123)

    const controlStatus = await axios.get(`http://localhost:${port}/api/pvlt/1.0/ctl/info/health`)
    const dataStatus = await axios.get(`http://localhost:${port}/api/pvlt/1.0/data/info/health`)

    expect(controlStatus.status).to.equal(200)
    expect(dataStatus.status).to.equal(200)
    expect(controlStatus.data).to.deep.equal({status: 'pass'})
    expect(dataStatus.data).to.deep.equal({status: 'pass'})

    await vault.stop()

    await expect(axios.get(`http://localhost:${port}/api/pvlt/1.0/data/info/health`)).to.be.rejected
    await expect(axios.get(`http://localhost:${port}/api/pvlt/1.0/ctl/info/health`)).to.be.rejected
  })

  it('should be able to start vault on specific port', async () => {
    const port = 57384
    const vault = new Vault({ port, env: testEnv })
    const actualPort = await vault.start()

    expect(actualPort).to.equal(port)

    const controlStatus = await axios.get(`http://localhost:${port}/api/pvlt/1.0/ctl/info/health`)
    const dataStatus = await axios.get(`http://localhost:${port}/api/pvlt/1.0/data/info/health`)

    expect(controlStatus.status).to.equal(200)
    expect(dataStatus.status).to.equal(200)
    expect(controlStatus.data).to.deep.equal({status: 'pass'})
    expect(dataStatus.data).to.deep.equal({status: 'pass'})

    await vault.stop()
  })

  it('should be able to start vault with custom environment variables', async () => {
    const customAdminAPIKey = 'customAdminAPIKey';
    const vault = new Vault({
      env: {
        ...testEnv,
        PVAULT_SERVICE_ADMIN_API_KEY: customAdminAPIKey
      }
    })
    const port = await vault.start()

    const callWithKey = (key: string) => axios.get(`http://localhost:${port}/api/pvlt/1.0/system/info/version`, {
      headers: {
        Authorization: `Bearer ${key}`
      }
    })

    await expect(callWithKey('pvaultauth')).to.be.rejected;
    await expect(callWithKey(customAdminAPIKey)).to.be.fulfilled;
  })
})
