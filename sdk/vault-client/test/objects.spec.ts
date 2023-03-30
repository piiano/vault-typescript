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

    const objectToAdd = {
      name: 'John Doe',
      email: 'johndoe@example.com',
    };

    const newObject = await this.vaultClient.objects.addObject({
      ...defaults,
      requestBody: objectToAdd,
    });

    expect(newObject).to.have.property('id');

    const getEntireObject = await this.vaultClient.objects.getObjectById({
      ...defaults,
      id: newObject.id,
      options: ['unsafe', 'show_builtins'],
    });

    expect(getEntireObject).to.have.property('id');
    expect(getEntireObject).to.have.property('_creation_time');
    expect(getEntireObject.name).to.equal(objectToAdd.name);
    expect(getEntireObject.email).to.equal(objectToAdd.email);
    expect(Date.parse(getEntireObject._creation_time!)).to.be.within(Date.now() - 1000, Date.now());
    expect(Date.parse(getEntireObject._modification_time!)).to.be.within(Date.now() - 1000, Date.now());
  });
});

