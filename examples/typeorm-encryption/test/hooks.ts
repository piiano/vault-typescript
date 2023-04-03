import "reflect-metadata";
import {Vault} from "@piiano/testcontainers-vault";
import type {Context} from "mocha";

import {VaultClient} from "@piiano/vault-client";
import {DataSource} from "typeorm";
import main from "../src";
import {Server} from "http";


const vault = new Vault({
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: "none",
  },
});

declare module "mocha" {
  export interface Context {
    server: Server;
    dataSource: DataSource;
  }
}

export const mochaHooks = {
  async beforeAll(this: Context) {
    this.timeout(30000);
    this.slow(25000);

    // Start local test vault
    const port = await vault.start();

    // Create a vault connection options
    const options = {
      vaultURL: `http://localhost:${port}`,
      apiKey: "pvaultauth",
    };

    // Create a vault client
    const vaultClient = new VaultClient(options);

    // Create a collection in Vault
    await vaultClient.collections
      .addCollection({
      requestBody: {
        name: "user",
        type: "PERSONS",
        properties: [
          { name: "name", data_type_name: "NAME" },
          { name: "email", data_type_name: "EMAIL" },
          { name: "phone_number", data_type_name: "PHONE_NUMBER" },
          { name: "ssn", data_type_name: "SSN" },
        ],
      },
    });

    // Initialize the application server
    const { server, dataSource } = await main({
      vaultURL: options.vaultURL,
      database: "test.db",
      vaultAPIKey: options.apiKey,
      dropSchema: true,
      port: 0, // Use random port
    });

    this.dataSource = dataSource;
    this.server = server;
  },

  async afterAll(this: Context) {
    this.timeout(10000);

    // Drop the database
    await this.dataSource.dropDatabase();
    // Close the database connection
    await this.dataSource.destroy()
    // Stop the application server
    await new Promise(this.server.close.bind(this.server));
    // Stop the local test vault
    await vault.stop();
  },
};
