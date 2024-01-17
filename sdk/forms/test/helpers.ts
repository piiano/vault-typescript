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
export async function mockCDN(page: Page, vaultURL: string) {
  const cdnBaseURL = 'https://cdn.piiano.com/';
  await page.route(`${cdnBaseURL}**`, async (route) => {
    const file = route.request().url().replace(cdnBaseURL, '');
    const ext = file.split('.').pop();
    await route.fulfill({
      body: await fs.readFile(resolve(rootDir, 'dist', file), 'utf-8'),
      headers: {
        Host: 'cdn.piiano.com',
        'Content-Type': ext === 'html' ? 'text/html' : 'application/javascript',
        // ...(ext === 'html'
        //   ? {
        //       // CSP header that should reflect the CSP headers returned by the CDN in prod for the iframe html file.
        //       'content-security-policy': Object.entries({
        //         default: [`'none'`], // by default, block everything
        //         img: [`data:`], // allow data urls for images
        //         // TODO: calculate hashes for inline scripts and styles or use nonce
        //         script: [`'self'`, `'unsafe-inline'`],
        //         style: [`'self'`, `'unsafe-inline'`],
        //         connect: [vaultURL],
        //       })
        //         .map(([key, value]) => `${key}-src ${value.join(' ')};`)
        //         .join('; '),
        //     }
        //   : {}),
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
