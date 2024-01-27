import { promises as fs } from 'fs';
import { Page } from '@playwright/test';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ConsoleMessage } from 'playwright-core';

// @ts-ignore
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// serve the dist folder as a CDN to the test page.
// This allows us to test that the lib is loading the iframe from the CDN as expected to be in prod.
// It also allows us to add Content-Security-Policy headers to the CDN to test how the lib handles them.
export async function mockCDN(page: Page, vaultURL: URL, webPageURL: URL) {
  const cdnBaseURL = 'https://cdn.piiano.com/';
  await page.route(`${cdnBaseURL}**`, async (route) => {
    const file = route.request().url().replace(cdnBaseURL, '');
    const ext = file.split('.').pop();
    await route.fulfill({
      body: await fs.readFile(resolve(rootDir, 'dist', file), 'utf-8'),
      headers: {
        Host: 'cdn.piiano.com',
        'Content-Type': ext === 'html' ? 'text/html' : 'application/javascript',
        ...(ext === 'html'
          ? {
              // CSP header that should reflect the CSP headers returned by the CDN in prod for the iframe html file.
              'Content-Security-Policy': [
                'sandbox allow-forms allow-same-origin allow-scripts', // define the iframe sandbox
                `frame-ancestors ${webPageURL.origin}`, // allow only the web page origin to load the iframe
                `default-src 'none'`, // by default block all requests
                `img-src data:`, // allow data urls for images
                `script-src 'unsafe-inline'`, // allow our own inline scripts
                `style-src 'unsafe-inline'`, // allow our own inline styles
                `connect-src ${vaultURL.origin}`, // allow requests to the vault
              ].join('; '),
            }
          : {}),
      },
    });
  });
}

// serve test web page HTML as if it was loaded with its own URL.
export async function mockWebPage(page: Page, pageURL: URL, body = '') {
  await page.route(pageURL.toString(), async (route) => {
    await route.fulfill({
      body: testHTML(body),
      headers: {
        Host: pageURL.host,
        'Content-Type': 'text/html',
      },
    });
  });
}

export function testHTML(body = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Test Forms</title>
  <!-- Include Piiano Vault Client -->
  <script src="https://cdn.piiano.com/pvault-forms-lib-latest.js"></script>
</head>
<body>
${body}
</body>
</html>
`;
}

type WaitForConsoleOptions = {
  message?: string | RegExp;
  type?: string;
  timeout?: number;
};

export function waitForConsole(
  page: Page,
  { message, type = 'log', timeout = 10000 }: WaitForConsoleOptions = {},
): Promise<string> {
  let resolve: ((text: string) => void) | undefined;
  let reject: ((err: Error) => void) | undefined;
  const timer = setTimeout(() => {
    reject?.(new Error(`Timeout waiting for console log (timeout: ${timeout}ms)`));
  }, timeout);

  const listener = (msg: ConsoleMessage) => {
    if (msg.type() !== type) {
      return;
    }
    const text = msg.text();
    if (message && (typeof message === 'string' ? text !== message : !message.test(text))) {
      return;
    }

    resolve?.(text);
  };

  return new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
    page.on('console', listener);
  }).finally(() => {
    clearTimeout(timer);
    page.off('console', listener);
  });
}
