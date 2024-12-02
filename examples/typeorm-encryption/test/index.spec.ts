import "reflect-metadata";
import { User } from "../src/entity/User";
import { Vault } from "@piiano/testcontainers-vault";
import { VaultClient } from "@piiano/vault-client";
import main from "../src";
import type { Server } from "http";
import type { DataSource, Repository } from "typeorm";
import { before, describe, after, it, afterEach } from "node:test";
import { equal } from "node:assert";

describe("collections", function () {
  const vault = new Vault({
    ...(process.env.VAULT_VERSION
      ? { version: process.env.VAULT_VERSION }
      : {}),
    env: {
      PVAULT_SENTRY_ENABLE: false,
      PVAULT_LOG_DATADOG_ENABLE: "none",
    },
  });

  let vaultClient: VaultClient;
  let app: { server: Server; dataSource: DataSource };
  let userRepository: Repository<User>;

  before(
    async () => {
      // Start local test vault
      const port = await vault.start();

      // Create a vault connection options
      const options = {
        vaultURL: `http://localhost:${port}`,
        apiKey: "pvaultauth",
      };

      // Create a vault client
      vaultClient = new VaultClient(options);

      // Create a collection in Vault
      await vaultClient.collections.addCollection({
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
      app = await main({
        vaultURL: options.vaultURL,
        database: "test.db",
        vaultAPIKey: options.apiKey,
        dropSchema: true,
        port: 0, // Use random port
      });

      userRepository = app.dataSource.getRepository(User);
    },
    { timeout: 30000 },
  );

  after(
    async () => {
      // Drop the database
      await app.dataSource.dropDatabase();
      // Close the database connection
      await app.dataSource.destroy();
      // Stop the application server
      await new Promise(app.server.close.bind(app.server));
      // Stop the local test vault
      await vault.stop();
    },
    { timeout: 10000 },
  );

  afterEach(async function () {
    // clear the database after each test
    await userRepository.clear();
  });

  it("demonstration", async function () {
    console.log("Adding users");
    console.log(
      "Adding user john with email john@exmaple.com and with phone 123-11111",
    );
    await userRepository.save({
      name: "john",
      email: "john@exmaple.com",
      phone: "123-11111",
      ssn: "123-11-1111",
      dob: "1990-01-01",
      state: "CA",
    });

    console.log(
      "Adding user john with email john2@exmaple.com and with phone 123-22222",
    );
    await userRepository.save({
      name: "john",
      email: "john2@exmaple.com",
      phone: "123-22222",
      ssn: "123-11-2222",
      dob: "1992-12-02",
      state: "CA",
    });

    console.log(
      "Adding user john with email alice@exmaple.com and with phone 123-33333",
    );
    await userRepository.save({
      name: "alice",
      email: "alice@exmaple.com",
      phone: "123-33333",
      ssn: "123-11-3333",
      dob: "1993-03-03",
      state: "CA",
    });

    console.log(
      "Adding user john with email bob@exmaple.com and with phone 123-44444",
    );
    await userRepository.save({
      name: "bob",
      email: "bob@exmaple.com",
      phone: "123-4444",
      ssn: "123-11-4444",
      dob: "1994-04-04",
      state: "MA",
    });

    console.log("Get all customers --> Expecting 4 results");
    const allUsers = await userRepository.find();
    equal(allUsers.length, 4);
    console.log(allUsers);

    console.log(
      "Showing encrypted data in db (note all columns are encrypted except the 'state' columns)",
    );
    console.log(await app.dataSource.query("SELECT * FROM user"));
  });
});
