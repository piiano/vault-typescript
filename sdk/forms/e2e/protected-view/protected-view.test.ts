import { expect, FrameLocator, test } from '@playwright/test';
import { prepareProtectedViewTest } from './setup';
import { waitForConsole } from '../helpers/waitForConsole';
import { ProtectedViewOptions } from '../../src';

test.describe('Protected View', () => {
  const props = ['card_holder', 'card_number', 'card_expiry', 'card_cvv'];
  const testObjects = JSON.parse(process.env.TEST_OBJECTS as string);
  const objectIds = Object.keys(testObjects) as string[];
  const objects = Object.values(testObjects) as object[];

  test('should create a protected view and display single object', async ({ page }) => {
    const object = objects[0];
    const id = objectIds[0];
    const displayProps = ['card_holder', 'card_number', 'card_expiry'];
    // Set up the protected view with required options using the running vault instance
    const view = await prepareProtectedViewTest(page, {
      collection: 'credit_cards',
      ids: [id],
      props: displayProps,
    });

    // Check that the view is rendered with the expected data
    const iframe = page.locator('#view-container').frameLocator('iframe');
    await assertObjectPropsRendered(iframe, object, props, displayProps);

    await view.evaluate((view) => view.destroy());
    await expect(page.locator('#view-container').locator('iframe')).not.toBeVisible();
    expect(await page.locator('#view-container').locator('iframe').count()).toBe(0);
  });

  // Test: Display multiple objects and verify data visibility
  test('should create a protected view and display multiple objects', async ({ page }) => {
    const ids = objectIds;
    const displayProps = ['card_holder', 'card_expiry'];

    // Set up the protected view with multiple objects
    const view = await prepareProtectedViewTest(page, {
      collection: 'credit_cards',
      ids: ids,
      props: displayProps,
    });

    // Verify data for each object is rendered
    const iframe = page.locator('#view-container').frameLocator('iframe');
    for (const [index, object] of objects.entries()) {
      await assertObjectPropsRendered(iframe, object, props, displayProps, index);
    }

    await view.evaluate((view) => view.destroy());
    await expect(page.locator('#view-container').locator('iframe')).not.toBeVisible();
    expect(await page.locator('#view-container').locator('iframe').count()).toBe(0);
  });

  test('should handle invalid object ID gracefully', async ({ page }) => {
    const log = waitForConsole(page, { message: /^test onError hook:/ });

    // Set up the protected view with an invalid object ID
    const view = await prepareProtectedViewTest(page, {
      collection: 'credit_cards',
      ids: ['invalid-object-id'],
      props: ['card_holder', 'card_expiry'],
    });

    const err = (await log).slice('test onError hook: '.length);
    expect(err).toEqual('Invalid object ID');

    // Call destroy method when the initialization fails should throw the init error
    await expect(() => view.evaluate((view) => view.destroy())).rejects.toThrow();
  });

  test('should pass custom CSS to the protected view', async ({ page }) => {
    const object = objects[1];
    const id = objectIds[1];
    const displayProps = ['card_holder', 'card_expiry'];
    const options: ProtectedViewOptions = {
      vaultURL: `http://localhost:${process.env.VAULT_PORT}`,
      apiKey: 'pvaultauth',
      dynamic: true,
      collection: 'credit_cards',
      ids: [id],
      props: displayProps,
      css: `.view { background-color: red; }`,
    };
    const view = await prepareProtectedViewTest(page, options);

    const iframe = page.locator('#view-container').frameLocator('iframe');
    await assertObjectPropsRendered(iframe, object, props, displayProps);

    const viewContainer = iframe.locator('.view');
    await expect(viewContainer).toHaveCSS('background-color', 'rgb(255, 0, 0)');

    await view.evaluate(
      (view, options) =>
        view.update({
          ...options,
          css: `.view { background-color: blue; }`,
        }),
      options,
    );
    await assertObjectPropsRendered(iframe, object, props, displayProps);
    await expect(viewContainer).toHaveCSS('background-color', 'rgb(0, 0, 255)');
  });
});

async function assertObjectPropsRendered(
  iframe: FrameLocator,
  object: object,
  props: string[],
  displayProps: string[],
  index = 0,
) {
  for (const propName of props) {
    const field = iframe.locator(`[data-name="${propName}"]`).nth(index);
    if (displayProps.includes(propName)) {
      await expect(field).toBeVisible();
      const label = field.locator('label');
      await expect(label).toBeVisible();
      await expect(label).toContainText(propName);
      const value = field.locator('.value');
      await expect(value).toBeVisible();
      await expect(value).toContainText(object[propName as keyof typeof object]);
    } else {
      await expect(field).not.toBeVisible();
    }
  }
}
