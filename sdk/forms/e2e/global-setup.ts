import { initDevelopmentVault } from '../vite/init-dev-vault';

export default async function globalSetup() {
  const vault = await initDevelopmentVault();
  process.env.VAULT_PORT = String(await vault.start());
}
