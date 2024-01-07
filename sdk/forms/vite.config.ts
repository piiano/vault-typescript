import { defineConfig, UserConfig, UserConfigFnPromise } from 'vite';
import * as path from 'path';
import { optimizeVaultClientBundleSize } from './vite/optimize-vault-client-bundle-size';
import { singleInlinedHtml } from './vite/single-inlined-html';
import { appendSuffixes } from './vite/append-suffixes';
import { initDevelopmentVault } from './vite/init-dev-vault';
import { version } from './package.json';

// https://vitejs.dev/config/
const config: UserConfigFnPromise = async ({ mode }): Promise<UserConfig> => {
  if (mode === 'dev') {
    const devVault = await initDevelopmentVault();
    process.env.VITE_VAULT_PORT = String(await devVault.start());
  }

  const [major, minor, patch] = version.split('.');

  const target = {
    lib: {
      input: 'src/index.ts',
      output: {
        name: 'pvault-forms-lib.js',
        // allow the lib to be loaded by any of the following suffixes.
        suffixes: ['latest', `v${major}`, `v${major}.${minor}`, `v${major}.${minor}.${patch}`],
      },
    },
    iframe: {
      input: 'src/protected-forms/iframe/index.html',
      output: {
        name: 'pvault-forms-iframe.html',
        // the lib load the iframe always by the exact version so we don't need to create other suffixes.
        suffixes: [`v${version}`],
      },
    },
  }[process.env.BUILD_TARGET ?? 'lib']!;
  process.env.VITE_IFRAME_URL =
    mode === 'dev'
      ? './src/protected-forms/iframe/index.html'
      : `https://cdn.piiano.com/pvault-forms-iframe-v${version}.html`;

  return {
    // define  : {
    // },
    publicDir: false,
    base: undefined,
    build: {
      target: 'es2022',
      minify: true,
      sourcemap: false,
      outDir: path.resolve(__dirname, 'dist'),
      cssCodeSplit: false,
      modulePreload: false,
      assetsInlineLimit: 100_000_000,
      emptyOutDir: false,
      rollupOptions: {
        input: target.input,
        output: {
          format: 'es',
          manualChunks: undefined,
          compact: true,
          inlineDynamicImports: true,
        },
      },
    },
    plugins: [optimizeVaultClientBundleSize(), singleInlinedHtml(), appendSuffixes(target.output)],
    server: {
      port: 3000,
    },
  };
};

export default defineConfig(config);
