import { defineConfig } from '@playwright/test';
import { resolve } from 'path';

export default defineConfig({
  testDir: 'e2e',
  reporter: 'github',
  globalSetup: resolve('./e2e/global-setup.ts'),
});
