import { expect, test } from '@playwright/test';
import { prepareProtectedFormTest } from './setup';
import { Form } from '../../src';
import { waitForConsole } from '../helpers/waitForConsole';

const validations: {
  field: string;
  validValue: string;
  invalidValue: string;
}[] = [
  {
    field: 'card_holder',
    validValue: 'Jane Doe',
    invalidValue: '',
  },
  {
    field: 'card_number',
    validValue: '4111111111111111',
    invalidValue: '4111111111111112',
  },
  {
    field: 'card_expiry',
    validValue: '12/25',
    invalidValue: '123',
  },
  {
    field: 'card_cvv',
    validValue: '123',
    invalidValue: '12',
  },
];

for (const { field, validValue, invalidValue } of validations) {
  test.describe(`input ${field}`, () => {
    test(`test validations for input ${field}`, async ({ page }) => {
      const { form, protectedFormHandle } = await prepareProtectedFormTest(page, {
        strategy: 'store-object',
        submitButton: undefined,
      });

      // By default, doesn't show validation messages when just initializing the form.
      const validationMessage = form.inputs[field].input?.locator('~ .validation-message')!;
      await expect(validationMessage).toBeHidden();

      // After filling the input with a valid value, the validation should still not be shown.
      await form.inputs[field].input?.fill(validValue);
      await expect(validationMessage).toBeHidden();

      // After filling the input with an invalid value, the validation should still be hidden.
      // We show the validation message only after the form was submitted once.
      await form.inputs[field].input?.fill(invalidValue);
      await expect(validationMessage).toBeHidden();

      const log = waitForConsole(page, { message: /^test onError hook: / });
      const error = await protectedFormHandle.evaluate((form: Form<'fields'>) => form.submit().catch((e) => e.message));

      expect(error).toEqual('Form validation failed');
      expect(await log).toMatch(/^test onError hook: Error: Form validation failed/);

      // After submitting the form, the validation should be shown.
      await expect(validationMessage).toBeVisible();
      await expect(form.inputs[field].input!).toBeFocused();

      // After filling the input with a valid value again, the validation should disappear.
      form.inputs[field].input?.fill(validValue);
      await expect(validationMessage).toBeHidden();

      // Now when filling the input with an invalid value, the validation should be shown immediately.
      form.inputs[field].input?.fill(invalidValue);
      await expect(validationMessage).toBeVisible();

      // Filling the input with a valid value again should hide the validation again.
      form.inputs[field].input?.fill(validValue);
      await expect(validationMessage).toBeHidden();

      // Submitting the form again should now succeed.
      const result = await protectedFormHandle.evaluate((form: Form<'fields'>) => form.submit());
      expect(result).toMatch(/^pvlt:read_object:credit_cards::[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/);
    });
  });
}
