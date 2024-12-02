import { Customer } from "./entity/customer";
import { Buyer, Seller } from "./entity/commerce";
import {
  BaseEntity,
  DataSource,
  EntityManager,
  ObjectLiteral,
  ObjectType,
} from "typeorm";
import { DeepPartial } from "typeorm/common/DeepPartial";
import { withTransformations } from "../src";
import "reflect-metadata";
import { Vault } from "@piiano/testcontainers-vault";
import { describe, it, before, after } from "node:test";
import { ok, equal, deepEqual } from "node:assert";
import registerVaultEncryption from "../src";
import { Collection, VaultClient } from "@piiano/vault-client";

// Create a local test Vault server
const vault = new Vault({
  ...(process.env.VAULT_VERSION ? { version: process.env.VAULT_VERSION } : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: "none",
  },
});

let dataSource: DataSource;

before(
  async () => {
    const port = await vault.start();

    const options = {
      vaultURL: `http://localhost:${port}`,
      apiKey: "pvaultauth",
    };

    const vaultClient = new VaultClient(options);

    for (const collection of collections) {
      await vaultClient.collections.addCollection({
        requestBody: collection,
      });
    }

    dataSource = new DataSource({
      type: "sqlite",
      synchronize: true,
      logging: false,
      dropSchema: true,
      database: "app.db",
      entities: [Customer, Buyer, Seller],
    });

    registerVaultEncryption(dataSource, options);

    dataSource = await dataSource.initialize();
  },
  { timeout: 30000 },
);

after(
  async () => {
    await vault.stop();
    await dataSource.dropDatabase();
    await dataSource.destroy();
  },
  { timeout: 10000 },
);

const collections: Array<Collection> = [
  {
    name: "customer",
    type: "PERSONS",
    properties: [
      { name: "name", data_type_name: "NAME" },
      { name: "email_field", data_type_name: "EMAIL" },
      { name: "phone_number", data_type_name: "PHONE_NUMBER" },
      { name: "address", data_type_name: "ADDRESS" },
      { name: "ssn", data_type_name: "SSN" },
    ],
  },
  {
    name: "buyer",
    type: "PERSONS",
    properties: [
      { name: "name", data_type_name: "NAME" },
      { name: "email", data_type_name: "EMAIL" },
      { name: "cardNumber", data_type_name: "CC_NUMBER" },
      { name: "cardHolderName", data_type_name: "CC_HOLDER_NAME" },
      { name: "cardExpiration", data_type_name: "CC_EXPIRATION_STRING" },
    ],
  },
  {
    name: "seller",
    type: "PERSONS",
    properties: [
      { name: "name", data_type_name: "NAME" },
      { name: "email", data_type_name: "EMAIL" },
      { name: "bankAccount", data_type_name: "BAN" },
    ],
  },
];

describe("typeorm encryption", function () {
  it("should be able to select transformed properties and search by encrypted props", async function () {
    const manager: EntityManager = dataSource.manager;

    const customer1 = new Customer();
    customer1.name = "John Doe";
    customer1.email = "john@gmail.com";
    customer1.phone = "+972-54-1234567";
    customer1.ssn = "078-05-1120";
    customer1.state = "IL";

    const customer2 = new Customer();
    customer2.name = "Shawn Kemp";
    customer2.email = "shawnkemp@example.com";
    customer2.phone = "+972-54-1234567";
    customer2.ssn = "078-05-1120";
    customer2.state = "IL";

    const added = await manager.save([customer1, customer2]);

    equal(added.length, 2);
    ok("id" in added[0]);
    ok("id" in added[1]);

    const foundCustomers = await withTransformations(Customer).find({
      select: {
        "phone.mask": true,
        email: true,
        "email.mask": true,
      },
    });

    deepEqual(foundCustomers, [
      {
        email: "john@gmail.com",
        "email.mask": "j***@gmail.com",
        "phone.mask": "*********4567",
      },
      {
        email: "shawnkemp@example.com",
        "email.mask": "s********@example.com",
        "phone.mask": "*********4567",
      },
    ]);

    const foundCustomersByEmail = await Customer.find({
      where: {
        email: "shawnkemp@example.com",
        phone: "+972-54-1234567",
      },
    });

    deepEqual(foundCustomersByEmail, [
      {
        ...customer2,
        phone: "+972541234567", // phone is being normalized
        id: added[1].id,
      },
    ]);
  });

  it("should work with entity manager", async function () {
    const tests = testCases();

    const manager: EntityManager = dataSource.manager;

    const added = await manager.save(
      tests.map(({ entityToAdd }) => entityToAdd),
    );

    equal(added.length, tests.length);

    for (let i = 0; i < tests.length; i++) {
      ok("id" in added[i]);

      const {
        modifications,
        entityToAdd,
        entityClass,
        normalizedEntityToAdd,
        normalizedModifications,
      } = tests[i];

      const addedWithInsertResult = await manager.insert(entityClass, {
        ...entityToAdd,
      });

      ok("identifiers" in addedWithInsertResult);
      equal(addedWithInsertResult.identifiers.length, 1);
      ok("id" in addedWithInsertResult.identifiers[0]);

      for (const id of [added[i].id, addedWithInsertResult.identifiers[0].id]) {
        const entity = await manager.findOneBy(entityClass, { id });

        deepEqual(entity, {
          ...entityToAdd,
          ...normalizedEntityToAdd,
          id,
        });

        const updateEntityResult = await manager.update(
          entityClass,
          { id },
          modifications,
        );

        equal(updateEntityResult.affected, 1);

        const updatedEntity = await manager.findOneBy(entityClass, { id });

        deepEqual(updatedEntity, {
          ...entity,
          ...modifications,
          ...normalizedModifications,
          id,
        });
      }
    }
  });

  it("should work with entity repository", async function () {
    const tests = testCases();

    for (let i = 0; i < tests.length; i++) {
      const {
        modifications,
        entityToAdd,
        entityClass,
        normalizedEntityToAdd,
        normalizedModifications,
      } = tests[i];

      const repository = dataSource.getRepository(entityClass);

      const addedEntityWithSave = await repository.save(entityToAdd);

      ok("id" in addedEntityWithSave);

      const { id, ...entityToAddWithInsert } = addedEntityWithSave;

      const addedEntityWithInsertResult = await repository.insert(
        entityToAddWithInsert,
      );

      ok("identifiers" in addedEntityWithInsertResult);
      equal(addedEntityWithInsertResult.identifiers.length, 1);
      ok("id" in addedEntityWithInsertResult.identifiers[0]);

      const ids = [id, addedEntityWithInsertResult.identifiers[0].id];
      for (const addedEntityID of ids) {
        const id = addedEntityID;

        const entity = await repository.findOneBy({ id });

        deepEqual(entity, { ...entityToAdd, ...normalizedEntityToAdd, id });

        const updateEntityResult = await repository.update(
          { id },
          modifications,
        );

        equal(updateEntityResult.affected, 1);

        const updatedEntity = await repository.findOneBy({ id });

        deepEqual(updatedEntity, {
          ...entity,
          ...modifications,
          ...normalizedModifications,
          id,
        });
      }
    }
  });

  it("should work with entity method", async function () {
    const tests = testCases();

    for (let i = 0; i < tests.length; i++) {
      const {
        modifications,
        entityToAdd,
        entityClass,
        normalizedEntityToAdd,
        normalizedModifications,
      } = tests[i];

      const addedEntity = await entityToAdd.save();

      ok("id" in addedEntity);

      const { id } = addedEntity;

      const entity = await (entityClass as typeof BaseEntity).findOneBy({
        id,
      } as any);

      deepEqual(entity, { ...entityToAdd, ...normalizedEntityToAdd, id });

      const updateEntityResult = await (
        entityClass as typeof BaseEntity
      ).update({ id } as any, modifications);

      equal(updateEntityResult.affected, 1);

      const updatedEntity = await (entityClass as typeof BaseEntity).findOneBy({
        id,
      } as any);

      deepEqual(updatedEntity, {
        ...entity,
        ...modifications,
        ...normalizedModifications,
        id,
      });
    }
  });
});

function testCases(): Array<EncryptionTest> {
  return [
    {
      name: "regular entity (customer)",
      entityClass: Customer,
      entityToAdd: Object.assign(new Customer(), {
        name: "John Doe",
        email: "john@gmail.com",
        phone: "+972-54-1234567",
        ssn: "078-05-1120",
        state: "IL",
      }),
      normalizedEntityToAdd: {
        phone: "+972541234567",
      },
      modifications: {
        email: "johndoe@example.com",
      },
      findByProp: "email",
    },
    {
      name: "entity with inheritance (buyers)",
      entityClass: Buyer,
      entityToAdd: Object.assign(new Buyer(), {
        name: "Shawn Kemp",
        email: "shawnkemp@example.com",
        cardNumber: "4111-1111-1111-1111",
        cardHolderName: "Shawn K",
        cardExpiration: "12/2023",
      }),
      normalizedEntityToAdd: {
        cardNumber: "4111111111111111",
      },
      modifications: {
        cardNumber: "3700 0000 0000 002",
        cardExpiration: "11/2027",
      },
      normalizedModifications: {
        cardNumber: "370000000000002",
      },
      findByProp: "cardNumber",
    },
    {
      name: "entity with inheritance (sellers)",
      entityClass: Seller,
      entityToAdd: Object.assign(new Seller(), {
        name: "Reggie Miller",
        email: "reggiemiller@example.com",
        bankAccount: "1234567890",
      }),
      modifications: {
        bankAccount: "0987654321",
      },
      findByProp: "bankAccount",
    },
  ];
}

type EncryptionTest<Entity extends ObjectLiteral & BaseEntity = any> = {
  name: string;
  entityClass: ObjectType<Entity>;
  entityToAdd: Entity;
  normalizedEntityToAdd?: DeepPartial<Entity>;
  modifications: DeepPartial<Entity>;
  normalizedModifications?: DeepPartial<Entity>;
  findByProp: string;
};
