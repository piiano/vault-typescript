import { Page } from '@playwright/test';
import { ProtectedViewOptions } from '../../src';
import { mockWebPage } from '../helpers/mockWebPage';
import { mockCDN } from '../helpers/mockCDN';

// Function to setup protected view page with a real Vault instance
export async function prepareProtectedViewTest(
  page: Page,
  options: Partial<ProtectedViewOptions> & Pick<ProtectedViewOptions, 'strategy' | 'display'>,
) {
  const vaultURL = new URL(`http://localhost:${process.env.VAULT_PORT}`);

  const htmlContent = `<div id="view-container"></div>`;
  const testPageURL = new URL('https://testwebpage.com');

  // Mock the webpage and CDN for Piiano Vault
  await mockWebPage(page, testPageURL, htmlContent);
  await mockCDN(page, vaultURL, testPageURL);

  // Navigate to the mocked page
  await page.goto(testPageURL.toString());

  const viewOptions: ProtectedViewOptions = {
    vaultURL: vaultURL.origin,
    apiKey: 'pvaultauth',
    ...options,
  };

  // Inject the protected view script
  return await page.evaluateHandle((viewOptions) => {
    return window.pvault.createProtectedView('#view-container', {
      ...viewOptions,
      hooks: {
        onError: (error) => console.log('test onError hook:', error.message),
      },
    });
  }, viewOptions);
}
