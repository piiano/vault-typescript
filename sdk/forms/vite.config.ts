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
    module: {
      input: 'src/index.ts',
    },
    lib: {
      input: 'src/lib.ts',
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
  // TODO: if the iframe will be loaded from the vault then we need change theses values dynamically
  //  to reflect the vault url and origin.
  Object.assign(
    process.env,
    mode === 'dev'
      ? {
          VITE_IFRAME_URL: './src/protected-forms/iframe/index.html',
          VITE_IFRAME_ORIGIN: 'http://localhost:3000',
        }
      : {
          VITE_IFRAME_URL: `https://cdn.piiano.com/pvault-forms-iframe-v${version}.html`,
          VITE_IFRAME_ORIGIN: 'https://cdn.piiano.com',
        },
  );

  return {
    publicDir: false,
    base: undefined,
    build: {
      target: 'es2022',
      minify: true,
      sourcemap: false,
      outDir: path.resolve(__dirname, process.env.BUILD_TARGET === 'module' ? 'dist/module' : 'dist'),
      cssCodeSplit: false,
      modulePreload: false,
      assetsInlineLimit: 100_000_000,
      emptyOutDir: false,
      rollupOptions: {
        input: target.input,
        preserveEntrySignatures: 'exports-only',
        output: {
          preserveModules: process.env.BUILD_TARGET === 'module',
          inlineDynamicImports: process.env.BUILD_TARGET !== 'module',
          preserveModulesRoot: 'src',
          entryFileNames: `[name].js`,
          format: 'es',
          manualChunks: undefined,
          compact: true,
        },
      },
    },
    plugins:
      process.env.BUILD_TARGET === 'module'
        ? [optimizeVaultClientBundleSize()]
        : [optimizeVaultClientBundleSize(), singleInlinedHtml(), appendSuffixes(target.output!)],
    server: {
      port: 3000,
    },
  };
};

export default defineConfig(config);
