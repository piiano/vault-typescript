import { initDevelopmentVault } from '../vite/init-dev-vault';

export default async function globalSetup() {
  const { vault, testObjects } = await initDevelopmentVault();
  process.env.VAULT_PORT = String(await vault.start());
  process.env.TEST_OBJECTS = JSON.stringify(testObjects);
}
