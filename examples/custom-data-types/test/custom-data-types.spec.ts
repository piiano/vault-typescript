import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {expect} from "chai";

describe('custom data types', function () {
  it('create custom bundle and custom data type and use it', async function () {
    const bundleCode = await readFile(resolve(__dirname, '../dist/index.js'));
    const bundle = await this.vaultClient.bundles.addBundle({
      requestBody: {
        name: 'string_ssn',
        description: 'Functions for custom SSN type',
        code: bundleCode.toString('base64')
      }
    })

    expect(bundle.exports?.validators).to.have.length(1);
    expect(bundle.exports?.validators?.[0]?.name).to.equal('validate');
    expect(bundle.exports?.validators?.[0]?.type).to.equal('validator');

    expect(bundle.exports?.normalizers).to.have.length(1);
    expect(bundle.exports?.normalizers?.[0]?.name).to.equal('normalize');
    expect(bundle.exports?.normalizers?.[0]?.type).to.equal('normalizer');

    expect(bundle.exports?.transformers).to.have.length(3);
    expect(bundle.exports?.transformers?.map(({name, type}) => ({name, type}))).to.have.same.deep.members([
      {type: 'transformer', name: 'compact'},
      {type: 'transformer', name: 'mask'},
      {type: 'transformer', name: 'with_spaces'},
    ]);

    await this.vaultClient.customDataTypes.addDataType({
      requestBody: {
        name: "STRING_SSN",
        base_type_name: "STRING",
        description: "A custom SSN type with custom validations and transformations based on the built-in STRING type.",
        validator: "string_ssn.validate",
        normalizer: "string_ssn.normalize",
        transformers: [
          "string_ssn.mask",
          "string_ssn.compact",
          "string_ssn.with_spaces"
        ]
      }
    })

    await this.vaultClient.collections.addCollection({
      requestBody: {
        name: "ssns",
        type: "PERSONS",
        properties: [
          {
            name: "ssn",
            data_type_name: "STRING_SSN"
          }
        ]
      }
    });

    const { id } = await this.vaultClient.objects.addObject({
      collection: 'ssns',
      reason: 'AppFunctionality',
      requestBody: {
        ssn: "123456789"
      }
    });
    expect(id).to.be.a('string');

    // Read SSN with and without transformations
    const result = await this.vaultClient.objects.getObjectById({
      collection: 'ssns',
      reason: 'AppFunctionality',
      id,
      props: ['ssn', 'ssn.mask', 'ssn.compact', 'ssn.with_spaces']
    });

    expect(result).to.deep.equal({
      ssn: '123-45-6789',
      'ssn.compact': '123456789',
      'ssn.mask': '***-**-6789',
      'ssn.with_spaces': '123 45 6789'
    });
  });
});
