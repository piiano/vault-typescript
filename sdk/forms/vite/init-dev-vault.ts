import { Vault } from '@piiano/testcontainers-vault';
import { ObjectFields, VaultClient } from '@piiano/vault-client';

const testObjects = [
  { card_number: '4111111111111111', card_holder: 'Jane Doe', card_expiry: '10/2026', card_cvv: '123' },
  { card_number: '5555555555554444', card_holder: 'John Doe', card_expiry: '12/2028', card_cvv: '456' },
];

export async function initDevelopmentVault(): Promise<{ vault: Vault; testObjects: Record<string, ObjectFields> }> {
  // Start a Vault server to use for testing/development.
  const vault = new Vault({
    reuse: true,
    env: {
      PVAULT_DEVMODE: true,
      PVAULT_SENTRY_ENABLE: false,
      PVAULT_LOG_DATADOG_ENABLE: 'none',
      // The iframe is loaded from this domain so vault needs to allow it.
      PVAULT_SERVICE_ALLOW_ORIGINS: 'https://cdn.piiano.com,http://localhost:3000',
    },
  });
  const vaultPort = await vault.start();

  const vaultClient = new VaultClient({ vaultURL: `http://localhost:${vaultPort}`, apiKey: 'pvaultauth' });

  await vaultClient.bundles.addBundle({
    requestBody: {
      name: 'cc',
      description: 'Helper credit card transformation functions',
      code: Buffer.from(
        `
module.exports.format_card_number = {
  type: 'transformer',
  description: 'Formats the card number with spaces comparing to the default compact format',
  handler(context, object, value) {
    return String(value).replace(/([0-9]{4})/g, '$1 ').trim();
  }
};

module.exports.mask_card_number = {
  type: 'transformer',
  description: 'Credit card number masker for display',
  handler(context, object, value) {
    return '•••• •••• •••• ' + String(value).slice(-4);
  }
}

module.exports.format_card_exp = {
  type: 'transformer',
  description: 'Returns the card expiry in the form of MM/YY compared to the default MM/YYYY',
  handler(context, object, value) {
    return String(value).slice(0, 2) + '/' + String(value).slice(-2);
  }
};

module.exports.mask_card_exp = {
  type: 'transformer',
  description: 'Returns the card expiry in the form of ••/••',
  handler(context, object, value) {
    return '••/••';
  }
};

module.exports.mask_cvv = {
  type: 'transformer',
  description: 'Returns the CVV in the form of •••',
  handler(context, object, value) {
    return '•••';
  }
}
        `,
      ).toString('base64'),
    },
  });
  // .catch(() => void 0); // The vault might be reused and the bundle might already exist.

  await vaultClient.customDataTypes.updateDataType({
    type: 'CC_NUMBER',
    requestBody: { custom_transformers: ['cc.mask_card_number', 'cc.format_card_number'] },
  });
  await vaultClient.customDataTypes.updateDataType({
    type: 'CC_EXPIRATION_STRING',
    requestBody: { custom_transformers: ['cc.mask_card_exp', 'cc.format_card_exp'] },
  });
  await vaultClient.customDataTypes.updateDataType({
    type: 'CC_CVV',
    requestBody: { custom_transformers: ['cc.mask_cvv'] },
  });

  await vaultClient.collections
    .addCollection({
      format: 'json',
      requestBody: {
        name: 'credit_cards',
        type: 'DATA',
        properties: [
          { name: 'card_number', data_type_name: 'CC_NUMBER' },
          { name: 'card_holder', data_type_name: 'CC_HOLDER_NAME' },
          { name: 'card_expiry', data_type_name: 'CC_EXPIRATION_STRING' },
          { name: 'card_cvv', data_type_name: 'CC_CVV' },
        ],
      },
    })
    .catch(() => void 0); // The vault might be reused and the collection might already exist.

  const response = await vaultClient.objects.addObjects({
    collection: 'credit_cards',
    reason: 'Other',
    adhocReason: 'Test',
    requestBody: testObjects,
  });

  return {
    vault,
    testObjects: Object.fromEntries(response.results.map((result, index) => [result.id as string, testObjects[index]])),
  };
}
