import "reflect-metadata"
import {Vault} from "@piiano/testcontainers-vault";
import type {Context} from "mocha";
import {DataSource} from "typeorm";
import {Customer} from "./entity/Customer";
import registerVaultEncryption from "../src";
import {VaultClient} from "@piiano/vault-client";


// Create a local test Vault server
const vault = new Vault({
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: 'none',
  }
});

export const mochaHooks = {

  async beforeAll(this: Context) {
    this.timeout(30000);
    this.slow(25000);
    const port = await vault.start();

    const options = {
      vaultURL: `http://localhost:${port}`,
      apiKey: "pvaultauth",
    };

    const vaultClient = new VaultClient(options);

    // Create customers collection in Vault
    await vaultClient.collections.addCollection({
      requestBody: {
        name: "customers",
        type: "PERSONS",
        properties: [
          {name: 'name', data_type_name: 'NAME'},
          {name: 'email', data_type_name: 'EMAIL'},
          {name: 'phone', data_type_name: 'PHONE_NUMBER'},
          {name: 'address', data_type_name: 'ADDRESS'},
          {name: 'ssn', data_type_name: 'SSN'},
          // TODO: Fix this issue with Date type
          // {name: 'dob', data_type_name: 'STRING'}
          // {name: 'dob', data_type_name: 'DATE_OF_BIRTH'}
        ]
      },
    });

    const dataSource = new DataSource({
      type: "sqlite",
      synchronize: true,
      logging: false,
      database: "app.db",
      entities: [Customer],
    });

    registerVaultEncryption(dataSource, options);

    this.dataSource = await dataSource.initialize();
  },

  async afterAll(this: Context) {
    this.timeout(10000);
    await vault.stop();
    await this.dataSource.dropDatabase();
    await this.dataSource.destroy();
  }
};
