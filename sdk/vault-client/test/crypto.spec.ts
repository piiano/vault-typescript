import { addTestCollection } from "./collections.spec";
import { VaultClient, Reason, Collection } from "..";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

describe("crypto", function () {
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

  after(async function (t) {
    await vaultClient.collections.deleteCollection({
      collection: testCollection.name,
    });
  });

  it("should be able encrypt and decrypt", async function (t) {
    const defaults: { collection: string; reason: Reason } = {
      collection: testCollection.name,
      reason: "AppFunctionality",
    };

    const objectToEncrypt = {
      name: "John Doe",
      email: "johndoe@example.com",
    };

    const encryptedObjects = await vaultClient.crypto.encrypt({
      ...defaults,
      requestBody: [
        {
          object: {
            fields: objectToEncrypt,
          },
        },
      ],
    });

    assert.equal(encryptedObjects.length, 1);
    assert.equal(typeof encryptedObjects[0].ciphertext, "string");

    const decryptedObject = await vaultClient.crypto.decrypt({
      ...defaults,
      requestBody: [
        {
          encrypted_object: encryptedObjects[0],
          props: ["name"],
        },
      ],
    });

    assert.deepEqual(decryptedObject, [
      { fields: { name: objectToEncrypt.name } },
    ]);

    const newEmail = "john@example.com";
    const updateEncryptedObjects = await vaultClient.crypto.updateEncrypted({
      ...defaults,
      requestBody: [
        {
          fields: {
            email: newEmail,
          },
          encrypted_object: encryptedObjects[0],
        },
      ],
    });

    assert.equal(updateEncryptedObjects.length, 1);
    assert.equal(typeof updateEncryptedObjects[0].ciphertext, "string");

    const decryptedUpdatedObject = await vaultClient.crypto.decrypt({
      ...defaults,
      requestBody: [
        {
          encrypted_object: updateEncryptedObjects[0],
        },
      ],
    });

    assert.deepEqual(decryptedUpdatedObject, [
      { fields: { name: objectToEncrypt.name, email: newEmail } },
    ]);
  });
});
