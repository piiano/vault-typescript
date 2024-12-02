import { VaultClient, Collection } from "..";
import { describe, it, beforeEach, afterEach, before } from "node:test";
import assert from "node:assert";

describe("collections", function () {
  let vaultClient: VaultClient;
  before(async () => {
    vaultClient = new VaultClient({ vaultURL: process.env.VAULT_URL });
  });

  const testCollection: Collection = {
    name: "test_collection",
    type: "PERSONS",
    properties: [
      { name: "name", is_encrypted: true, data_type_name: "NAME" },
      { name: "email", is_encrypted: true, data_type_name: "EMAIL" },
    ],
  };

  beforeEach(() => addTestCollection(vaultClient, testCollection));

  afterEach(async function (t) {
    await vaultClient.collections.deleteCollection({
      collection: testCollection.name,
    });
  });

  it("should be able to get a collection", async function (t) {
    const collection = await vaultClient.collections.getCollection({
      collection: testCollection.name,
    });

    assert.equal(collection.name, testCollection.name);
    assert.equal(collection.type, "PERSONS");
    assert.equal(collection.properties.length, 2);
  });

  it("should be able to list collections", async function (t) {
    const collections = await vaultClient.collections.listCollections({});
    assert.equal(collections.length, 1);
    assert.equal(collections[0].name, testCollection.name);
    assert.equal(collections[0].type, "PERSONS");
    assert.equal(collections[0].properties.length, 2);
  });

  it("should be able to update a collection", async function (t) {
    await vaultClient.collections.updateCollection({
      collection: testCollection.name,
      requestBody: {
        name: testCollection.name,
        type: "PERSONS",
        properties: [
          {
            name: "phone",
            is_encrypted: true,
            data_type_name: "PHONE_NUMBER",
          },
        ],
      },
    });

    const collection = await vaultClient.collections.getCollection({
      collection: testCollection.name,
    });

    assert.equal(collection.name, testCollection.name);
    assert.equal(collection.type, "PERSONS");
    assert.equal(collection.properties.length, 3);
  });
});

export async function addTestCollection(
  vaultClient: VaultClient,
  collection: Collection,
) {
  const newCollection = await vaultClient.collections.addCollection({
    requestBody: collection,
  });

  console.assert("creation_time" in newCollection);
  console.assert("modification_time" in newCollection);
  const creationTime = Date.parse(newCollection.creation_time!);
  assert.ok(creationTime > Date.now() - 1000 && creationTime < Date.now());
  const modificationTime = Date.parse(newCollection.modification_time!);
  assert.ok(
    modificationTime > Date.now() - 1000 && modificationTime < Date.now(),
  );
}
