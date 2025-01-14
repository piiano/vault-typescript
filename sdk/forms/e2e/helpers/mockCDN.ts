import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Page } from '@playwright/test';
import { promises as fs } from 'fs';

// @ts-ignore
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// serve the dist folder as a CDN to the test page.
// This allows us to test that the lib is loading the iframe from the CDN as expected to be in prod.
// It also allows us to add Content-Security-Policy headers to the CDN to test how the lib handles them.
export async function mockCDN(page: Page, vaultURL: URL, webPageURL: URL) {
  const cdnBaseURL = 'https://cdn.piiano.com/';
  await page.route(`${cdnBaseURL}**`, async (route) => {
    const file = route.request().url().replace(cdnBaseURL, '');
    const ext = file.split('.').pop();
    const fileContent = await fs.readFile(resolve(rootDir, 'dist', file), 'utf-8');
    const scriptsSha256 = [] as string[];
    if (ext === 'html') {
      const metadataFile = await fs.readFile(resolve(rootDir, 'dist', `${file}.metadata.json`), 'utf-8');
      const metadata = JSON.parse(metadataFile);
      scriptsSha256.push(...metadata['scripts-sha256'].split(','));
    }

    await route.fulfill({
      body: fileContent,
      headers: {
        Host: 'cdn.piiano.com',
        'Content-Type': ext === 'html' ? 'text/html' : 'application/javascript',
        ...(ext === 'html'
          ? {
              // CSP header that should reflect the CSP headers returned by the CDN in prod for the iframe html file.
              'Content-Security-Policy': [
                'sandbox allow-forms allow-same-origin allow-scripts', // define the iframe sandbox
                `require-trusted-types-for 'script'`,
                `trusted-types 'none'`,
                `default-src 'none'`, // by default block all requests
                `img-src data:`, // allow data urls for images
                `script-src ${scriptsSha256.map((sha) => `'sha256-${sha}'`).join(' ')}`, // allow our scripts with matching sha256
                `style-src 'unsafe-inline'`, // allow custom css to be set by the user
                `frame-ancestors ${webPageURL.origin}`, // allow only the web page origin to load the iframe
                `connect-src ${vaultURL.origin}`, // allow requests to the vault
              ].join('; '),
            }
          : {}),
      },
    });
  });
}
