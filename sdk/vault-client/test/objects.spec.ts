import { addTestCollection } from "./collections.spec";
import { VaultClient, Reason, Collection } from "..";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

describe("objects", function () {
  let vaultClient: VaultClient;
  before(() => {
    vaultClient = new VaultClient({ vaultURL: process.env.VAULT_URL });
  });

  const testCollection: Collection = {
    name: "test_objects_collection",
    type: "PERSONS",
    properties: [
      { name: "name", is_encrypted: true, data_type_name: "NAME" },
      { name: "email", is_encrypted: true, data_type_name: "EMAIL" },
    ],
  };

  before(() => addTestCollection(vaultClient, testCollection));

  after(async function () {
    await vaultClient.collections.deleteCollection({
      collection: testCollection.name,
    });
  });

  it("should be able work with objects", async function () {
    const defaults: { collection: string; reason: Reason } = {
      collection: testCollection.name,
      reason: "AppFunctionality" as Reason,
    };

    const name = "John Doe";
    const email = "johndoe@example.com";
    const objectToAdd = { name, email };

    const { id } = await vaultClient.objects.addObject({
      ...defaults,
      requestBody: objectToAdd,
    });

    assert.ok(typeof id === "string");
    assert.ok(id);

    const getEntireObject = await vaultClient.objects.getObjectById({
      ...defaults,
      id,
      options: ["unsafe", "show_builtins"],
    });

    assert.ok(getEntireObject);
    assert.ok("id" in getEntireObject);
    assert.ok("_creation_time" in getEntireObject);
    assert.equal(typeof getEntireObject._creation_time, "string");
    assert.ok("name" in getEntireObject);
    assert.equal(getEntireObject.name, objectToAdd.name);
    assert.ok("email" in getEntireObject);
    assert.equal(getEntireObject.email, objectToAdd.email);
    const creationTime = Date.parse(getEntireObject._creation_time);
    assert.ok(creationTime > Date.now() - 1000 && creationTime < Date.now());
    const modificationTime = Date.parse(getEntireObject._modification_time);
    assert.ok(
      modificationTime > Date.now() - 1000 && modificationTime < Date.now(),
    );

    const newEmail = "john@example.com";

    await vaultClient.objects.updateObjectById({
      ...defaults,
      id,
      requestBody: {
        email: newEmail,
      },
    });

    const updatedObject = await vaultClient.objects.getObjectById({
      ...defaults,
      id,
      options: ["unsafe"],
    });

    assert.deepEqual(updatedObject, { id, name, email: newEmail });

    await vaultClient.objects.deleteObjectById({ ...defaults, id });

    const getObjectPromise = vaultClient.objects.getObjectById({
      ...defaults,
      id,
      options: ["unsafe"],
    });

    await assert.rejects(getObjectPromise);

    const error = await getObjectPromise.catch((e) => e);

    // access the Vault error response
    assert.ok("body" in error);
    assert.deepEqual(error.body, {
      error_code: "PV3005",
      error_url: "https://docs.piiano.com/api/error-codes#PV3005",
      message: `One or more Objects is not found: ${id}. For more details, view the logs.`,
      context: {
        ids: id,
      },
    });
  });
});
