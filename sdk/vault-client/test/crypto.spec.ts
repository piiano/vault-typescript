import {expect} from "chai";
import {Collection} from "../";
import {addTestCollection} from "./collections.spec";
import {Reason} from "../src";

describe('crypto',  function () {

  const testCollection: Collection = {
    name: 'test_objects_collection',
    type: 'PERSONS',
    properties: [
      { name: 'name', is_encrypted: true, data_type_name: 'NAME' },
      { name: 'email', is_encrypted: true, data_type_name: 'EMAIL' },
    ]
  };

  before(addTestCollection(testCollection));

  after(async function () {
    await this.vaultClient.collections.deleteCollection({
      collection: testCollection.name,
    });
  });

  it('should be able encrypt and decrypt', async function () {
    const defaults: { collection: string, reason: Reason } = {
      collection: testCollection.name,
      reason: 'AppFunctionality',
    }

    const objectToEncrypt = {
      name: 'John Doe',
      email: 'johndoe@example.com',
    };

    const encryptedObjects = await this.vaultClient.crypto.encrypt({
      ...defaults,
      requestBody: [{
        object: {
          fields: objectToEncrypt,
        }
      }]
    })

    expect(encryptedObjects).to.have.lengthOf(1);
    expect(encryptedObjects[0]).to.have.a.property('ciphertext').not.empty;

    const decryptedObject = await this.vaultClient.crypto.decrypt({
      ...defaults,
      requestBody: [
        {
          encrypted_object: encryptedObjects[0],
          props: ['name'],
        }
      ]
    })

    expect(decryptedObject).to.deep.equal([ { fields: { name: objectToEncrypt.name } } ]);

    const newEmail = 'john@example.com';
    const updateEncryptedObjects = await this.vaultClient.crypto.updateEncrypted({
      ...defaults,
      requestBody: [{
        fields: {
          email: newEmail,
        },
        encrypted_object: encryptedObjects[0],
      }]
    });

    expect(updateEncryptedObjects).to.have.lengthOf(1);
    expect(updateEncryptedObjects[0]).to.have.a.property('ciphertext').not.empty;

    const decryptedUpdatedObject = await this.vaultClient.crypto.decrypt({
      ...defaults,
      requestBody: [
        {
          encrypted_object: updateEncryptedObjects[0],
        }
      ]
    });

    expect(decryptedUpdatedObject).to.deep.equal([ { fields: { name: objectToEncrypt.name, email: newEmail } } ]);
  });
});

