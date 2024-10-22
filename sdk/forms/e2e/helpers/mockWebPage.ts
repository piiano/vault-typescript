import { Page } from '@playwright/test';

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
