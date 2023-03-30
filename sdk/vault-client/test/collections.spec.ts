import {expect} from "chai";
import {AsyncFunc, Context} from "mocha";
import {Collection} from "../";


describe('collections',  function () {

  const testCollection: Collection = {
    name: 'test_collection',
    type: 'PERSONS',
    properties: [
      { name: 'name', is_encrypted: true, data_type_name: 'NAME' },
      { name: 'email', is_encrypted: true, data_type_name: 'EMAIL' },
    ]
  };

  beforeEach(addTestCollection(testCollection));

  afterEach(async function () {
    await this.vaultClient.collections.deleteCollection({
      collection: testCollection.name
    });
  });

  it('should be able to get a collection', async function () {
    const collection = await this.vaultClient.collections.getCollection({
      collection: testCollection.name
    });

    expect(collection.name).to.equal(testCollection.name);
    expect(collection.type).to.equal('PERSONS');
    expect(collection.properties).to.have.lengthOf(2);
  });

  it('should be able to list collections', async function () {
    const collections = await this.vaultClient.collections.listCollections({});
    expect(collections).to.have.lengthOf(1);
    expect(collections[0].name).to.equal(testCollection.name);
    expect(collections[0].type).to.equal('PERSONS');
    expect(collections[0].properties).to.have.lengthOf(2);
  });

  it('should be able to update a collection', async function () {
    await this.vaultClient.collections.updateCollection({
      collection: testCollection.name,
      requestBody: {
        name: testCollection.name,
          type: 'PERSONS',
          properties: [
          {
            name: 'phone',
            is_encrypted: true,
            data_type_name: 'PHONE_NUMBER',
          }
        ]
      }
    });

    const collection = await this.vaultClient.collections.getCollection({
      collection: testCollection.name
    });

    expect(collection.name).to.equal(testCollection.name);
    expect(collection.type).to.equal('PERSONS');
    expect(collection.properties).to.have.lengthOf(3);
  });

});

export function addTestCollection(collection: Collection): AsyncFunc {
  return async function (this: Context) {
    const newCollection = await this.vaultClient.collections.addCollection({
      requestBody: collection
    });

    expect(Date.parse(newCollection.creation_time!)).to.be.within(Date.now() - 1000, Date.now());
    expect(Date.parse(newCollection.modification_time!)).to.be.within(Date.now() - 1000, Date.now());
  };
}
