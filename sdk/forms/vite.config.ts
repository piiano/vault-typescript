import {defineConfig} from 'vite';
import * as path from 'path';
import {Vault} from "@piiano/testcontainers-vault";
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig((async ()=> {
  let devVaultPort = 8123;
  if (process.env.NODE_ENV === 'development') {
    devVaultPort = await initDevelopmentVault();
  }

  return ({
    build: {
      copyPublicDir: false,
      minify: true,
      sourcemap: false,
      outDir: path.resolve(__dirname, 'dist'),
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'pvault',
        // iife (immediately invoked function expression) is the most compatible format to be used in the browser.
        formats: ['iife'],
        fileName: () => `pvault-forms-v${pkg.version.replace(/\./g,'-')}.js`,
      },
    },
    plugins: [
      {
        // Replace the errors dictionary repeated in every service to use a single shared errors object instead.
        // This reduces the bundle size by ~50kb!.
        name: 'optimize-bundle-size',
        enforce: 'post',
        apply: 'build',
        transform(code, id) {
          // Remove the errors dictionary repeated in every service.
          if (/\/generated\/services\/.*Client\.js$/.test(id)) {
            return code.replace(/,\s*errors: \{([^}]|\n)*}/g, '');
          }
          // Update the code to use a single errors map.
          if (/\/generated\/core\/request\.js$/.test(id)) {
            code.replace(/const errors = Object.assign\(\{.*}, options.errors\);/g, `const errors = ${JSON.stringify({
              400: "The request is invalid.",
              401: "Authentication credentials are incorrect or missing.",
              403: "The caller doesn't have the required access rights.",
              404: "The requested resource is not found.",
              405: "The operation is not allowed.",
              409: "A conflict occurs.",
              410: "Access to a resource that is no longer available occurs.",
              500: "An error occurs on the server.",
              503: "The service is unavailable."
            })};`);
          }
        },
      },
    ],
    server: {
      port: 3000,
      proxy: {
        // Emulate the backend API that received the form data.
        // Current implementation is echo request back to the client to verify the data got tokenized.
        '/backend': {
          target: `/`,
          selfHandleResponse: true,
          bypass: (req, res, options) => {
            const chunks: Buffer[] = [];
            res.write('Got:\n');
            req.on('data', (chunk) => chunks.push(chunk));
            const end = res.end.bind(res);
            req.on('end', () => {
              const data = Buffer.concat(chunks);
              res.write(JSON.stringify({
                method: req.method,
                body: Object.fromEntries(new URLSearchParams(data.toString()).entries()),
                queryParam: Object.fromEntries(new URLSearchParams(req.url!.replace('/backend', '')).entries()),
              }, null, 2 ));
              end();
            });
            res.end = () => res;
            return false;
          }
        },
        // Proxy the API calls to the Vault server (can be removed once the Vault support defining CORS rules).
        '/api': {
          target: `http://localhost:${devVaultPort}`,
          changeOrigin: true,
        },
      },
    },
  })
})());

async function initDevelopmentVault() {
  // Start a Vault server to use for testing/development.
  const vault = new Vault({
    env: {PVAULT_SENTRY_ENABLE: false, PVAULT_LOG_DATADOG_ENABLE: 'none'},
  });
  const port = await vault.start();

  // Create a collection to use for testing/development.
  await vault.exec('pvault', 'collection', 'add', '--collection-json', JSON.stringify({
    name: 'credit_cards',
    type: 'DATA',
    properties: [
      {name: 'card_number', data_type_name: 'CC_NUMBER'},
      {name: 'card_holder', data_type_name: 'CC_HOLDER_NAME'},
      {name: 'card_expiry', data_type_name: 'CC_EXPIRATION_STRING'},
      {name: 'card_cvv', data_type_name: 'CC_CVV'}
    ]
  }));
  return port;
}
