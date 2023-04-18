import "reflect-metadata"
import {Vault} from "@piiano/testcontainers-vault";
import type {Context} from "mocha";
import {DataSource} from "typeorm";
import registerVaultEncryption from "../src";
import {Collection, VaultClient} from "@piiano/vault-client";
import {Customer} from "./entity/customer";
import {Buyer, Seller} from "./entity/commerce";


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

    for (const collection of collections) {
      await vaultClient.collections.addCollection({
        requestBody: collection
      });
    }

    const dataSource = new DataSource({
      type: "sqlite",
      synchronize: true,
      logging: false,
      dropSchema: true,
      database: "app.db",
      entities: [Customer, Buyer, Seller],
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

const collections: Array<Collection> = [
  {
    name: "customer",
    type: "PERSONS",
    properties: [
      {name: 'name', data_type_name: 'NAME'},
      {name: 'email_field', data_type_name: 'EMAIL'},
      {name: 'phone_number', data_type_name: 'PHONE_NUMBER'},
      {name: 'address', data_type_name: 'ADDRESS'},
      {name: 'ssn', data_type_name: 'SSN'},
    ]
  },
  {
    name: "buyer",
    type: "PERSONS",
    properties: [
      {name: 'name', data_type_name: 'NAME'},
      {name: 'email', data_type_name: 'EMAIL'},
      {name: 'cardNumber', data_type_name: 'CC_NUMBER'},
      {name: 'cardHolderName', data_type_name: 'CC_HOLDER_NAME'},
      {name: 'cardExpiration', data_type_name: 'CC_EXPIRATION_STRING'},
    ]
  },
  {
    name: "seller",
    type: "PERSONS",
    properties: [
      {name: 'name', data_type_name: 'NAME'},
      {name: 'email', data_type_name: 'EMAIL'},
      {name: 'bankAccount', data_type_name: 'BAN'},
    ]
  },
]
