import { defineConfig, UserConfig, UserConfigFnPromise } from 'vite';
import * as path from 'path';
import { Vault } from '@piiano/testcontainers-vault';

// https://vitejs.dev/config/
const config: UserConfigFnPromise = async ({ mode }): Promise<UserConfig> => {
  const vault = await initDevelopmentVault();
  const port = await vault.start();
  process.env.VITE_VAULT_ENDPOINT = `http://localhost:${port}`;
  process.env.VITE_VAULT_API_KEY = `pvaultauth`;

  return {
    build: {
      copyPublicDir: false,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(__dirname, 'src/lib/index.ts'),
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
    server: {
      port: 3000,
    },
  };
};

export default defineConfig(config);

async function initDevelopmentVault(): Promise<Vault> {
  // Start a Vault server to use for testing/development.
  const vault = new Vault({
    reuse: true,
    env: {
      PVAULT_DEVMODE: true,
      PVAULT_SENTRY_ENABLE: false,
      PVAULT_LOG_DATADOG_ENABLE: 'none',
      // The iframe is loaded from this domain so Vault needs to allow it.
      PVAULT_SERVICE_ALLOW_ORIGINS: 'https://cdn.piiano.com',
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
