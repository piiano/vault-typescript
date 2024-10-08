import { Vault } from '@piiano/testcontainers-vault';
import { expect, Page } from '@playwright/test';

import { ProtectedFormOptions } from '../../src/options';
import { mockCDN } from '../helpers/mockCDN';
import { mockWebPage } from '../helpers/mockWebPage';

export async function prepareProtectedFormTest(page: Page, options: Partial<ProtectedFormOptions<any>> = {}) {
  const vaultURL = new URL(`http://localhost:${process.env.VAULT_PORT}`);
  const webPageURL = new URL('https://testwebpage.com');
  await mockCDN(page, vaultURL, webPageURL);
  await mockWebPage(page, webPageURL, `<div id="form-container"></div>`);
  await page.goto(webPageURL.toString());

  expect(page.getByTestId('form-container')).toBeDefined();

  const inputs: Record<
    string,
    {
      label: string;
      value: string;
      type: string;
      input?: ReturnType<typeof frame.getByRole>;
    }
  > = {
    card_holder: { label: 'Name', value: 'Jane Doe', type: 'CC_HOLDER_NAME' },
    card_number: { label: 'Card', value: '4111111111111111', type: 'CC_NUMBER' },
    card_expiry: { label: 'Expiry', value: '12/25', type: 'CC_EXPIRATION_STRING' },
    card_cvv: { label: 'CVV', value: '123', type: 'CC_CVV' },
  };

  const formOptions: ProtectedFormOptions<any> = {
    vaultURL: vaultURL.origin,
    apiKey: 'pvaultauth',
    debug: true,
    collection: 'credit_cards',
    fields: Object.entries(inputs).map(([name, { type: dataTypeName, label }]) => ({
      name,
      dataTypeName,
      label,
      required: true,
    })),
    submitButton: 'Pay',
    style: { theme: 'default' },
    ...options,
  };

  const protectedFormHandle = await page.evaluateHandle(async (formOptions) => {
    return window.pvault.createProtectedForm('#form-container', {
      ...formOptions,
      hooks: {
        onSubmit: (r) => console.log('test onSubmit hook:', JSON.stringify(r)),
        onError: (e) => console.log('test onError hook:', e),
      },
    });
  }, formOptions);

  // expecting the iframe to be loaded by the library
  const frame = page.frameLocator('iframe');
  expect(frame).toBeDefined();

  const innerForm = frame.getByRole('form');
  expect(innerForm).toBeDefined();

  for (const [name, { label, value }] of Object.entries(inputs)) {
    const input = frame.getByRole('textbox', { name: label });
    inputs[name].input = input;
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
    await expect(input).toBeEditable();
    await expect(input).toHaveValue('');
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  const submitButton = frame.getByRole('button', { name: 'Pay' });
  if (formOptions.submitButton) {
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  } else {
    await expect(submitButton).toHaveCount(0);
  }

  return {
    protectedFormHandle,
    frame,
    form: {
      form: innerForm,
      inputs,
      submitButton,
    },
  };
}
