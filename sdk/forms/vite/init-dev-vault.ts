import { Vault } from '@piiano/testcontainers-vault';

export async function initDevelopmentVault(): Promise<Vault> {
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
  await vault.start();

  // Create a collection to use for testing/development.
  await vault
    .exec(
      'pvault',
      'collection',
      'add',
      '--collection-json',
      JSON.stringify({
        name: 'credit_cards',
        type: 'DATA',
        properties: [
          { name: 'card_number', data_type_name: 'CC_NUMBER' },
          { name: 'card_holder', data_type_name: 'CC_HOLDER_NAME' },
          { name: 'card_expiry', data_type_name: 'CC_EXPIRATION_STRING' },
          { name: 'card_cvv', data_type_name: 'CC_CVV' },
        ],
      }),
    )
    .catch(console.error);

  return vault;
}
