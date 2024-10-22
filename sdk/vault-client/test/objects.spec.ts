import {expect, use} from "chai";
import {addTestCollection} from "./collections.spec";
import {Reason, Collection} from "..";
import * as chaiAsPromised from "chai-as-promised";

use(chaiAsPromised)

describe('objects',  function () {

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

  it('should be able work with objects', async function () {
    const defaults: { collection: string, reason: Reason } = {
      collection: testCollection.name,
      reason: 'AppFunctionality' as Reason,
    }

    const name = 'John Doe';
    const email = 'johndoe@example.com';
    const objectToAdd = { name, email };

    const { id } = await this.vaultClient.objects.addObject({ ...defaults, requestBody: objectToAdd });

    expect(id).to.be.a('string').not.empty;

    const getEntireObject = await this.vaultClient.objects.getObjectById({
      ...defaults, id, options: ['unsafe', 'show_builtins'],
    });

    expect(getEntireObject).to.have.property('id');
    expect(getEntireObject).to.have.property('_creation_time');
    expect(getEntireObject.name).to.equal(objectToAdd.name);
    expect(getEntireObject.email).to.equal(objectToAdd.email);
    expect(Date.parse(getEntireObject._creation_time!)).to.be.within(Date.now() - 1000, Date.now());
    expect(Date.parse(getEntireObject._modification_time!)).to.be.within(Date.now() - 1000, Date.now());


    const newEmail = 'john@example.com';

    await this.vaultClient.objects.updateObjectById({
      ...defaults, id,
      requestBody: {
        email: newEmail,
      }
    });

    const updatedObject = await this.vaultClient.objects.getObjectById({
      ...defaults, id,
      options: ['unsafe'],
    });

    expect(updatedObject).to.deep.equal({ id, name, email: newEmail });

    await this.vaultClient.objects.deleteObjectById({...defaults, id });

    const getObjectPromise = this.vaultClient.objects.getObjectById({...defaults, id, options: ['unsafe'] });

    await expect(getObjectPromise).to.be.rejected;

    const error = await getObjectPromise.catch(e => e);

    // access the Vault error response
    expect(error).to.have.property('body').deep.equal({
      error_code: 'PV3005',
      error_url: 'https://docs.piiano.com/api/error-codes#PV3005',
      message: `One or more Objects is not found: ${id}. For more details, view the logs.`,
      context: {
        ids: id,
      }
    });
  });
});
