import {Collection, CollectionsService} from "../";
import {expect} from "chai";

describe('collections',  function () {

  const testCollectionName = 'test_collection';

  beforeEach(async function () {
    await addTestCollection(testCollectionName);
  });

  afterEach(async function () {
    await CollectionsService.deleteCollection(testCollectionName);
  });

  it('should be able to get a collection', async function () {
    const collection = await CollectionsService.getCollection(testCollectionName);
    expect(collection.name).to.equal(testCollectionName);
    expect(collection.type).to.equal(Collection.type.PERSONS);
    expect(collection.properties).to.have.lengthOf(2);
  });

  it('should be able to list collections', async function () {
    const collections = await CollectionsService.listCollections();
    expect(collections).to.have.lengthOf(1);
    expect(collections[0].name).to.equal(testCollectionName);
    expect(collections[0].type).to.equal(Collection.type.PERSONS);
    expect(collections[0].properties).to.have.lengthOf(2);
  });

  it('should be able to update a collection', async function () {
    await CollectionsService.updateCollection(testCollectionName, {
      name: testCollectionName,
      type: Collection.type.PERSONS,
      properties: [
        {
          name: 'phone',
          is_encrypted: true,
          data_type_name: 'PHONE_NUMBER',
        }
      ]
    });

    const collection = await CollectionsService.getCollection(testCollectionName);

    expect(collection.name).to.equal(testCollectionName);
    expect(collection.type).to.equal(Collection.type.PERSONS);
    expect(collection.properties).to.have.lengthOf(3);
  });

});


async function addTestCollection(testCollectionName: string) {
  const collection = await CollectionsService.addCollection({
    name: testCollectionName,
    type: Collection.type.PERSONS,
    properties: [
      {
        name: 'name',
        is_encrypted: true,
        data_type_name: 'NAME',
      },
      {
        name: 'email',
        is_encrypted: true,
        data_type_name: 'EMAIL',
      },
    ]
  });

  expect(Date.parse(collection.creation_time!)).to.be.within(Date.now() - 1000, Date.now());
  expect(Date.parse(collection.modification_time!)).to.be.within(Date.now() - 1000, Date.now());
}
