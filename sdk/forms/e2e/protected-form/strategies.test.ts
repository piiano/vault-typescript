import { expect, test } from '@playwright/test';

import { prepareProtectedFormTest } from './setup';
import { Result, Strategy, Form } from '../../src';
import { waitForConsole } from '../helpers/waitForConsole';

test.describe.configure({
  timeout: 600000,
});
test.describe('strategies', () => {
  const strategies: {
    strategy: Strategy<any>;
    resultAssertion: (result: any) => void;
  }[] = [
    {
      strategy: 'tokenize-fields',
      resultAssertion: (result: Result<'fields'>) => {
        expect(Object.keys(result)).toEqual(['card_holder', 'card_number', 'card_expiry', 'card_cvv']);
        expect(result.card_holder).toMatch(
          /^pvlt:detokenize:credit_cards:card_holder:[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/,
        );
        expect(result.card_number).toMatch(
          /^pvlt:detokenize:credit_cards:card_number:[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/,
        );
        expect(result.card_expiry).toMatch(
          /^pvlt:detokenize:credit_cards:card_expiry:[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/,
        );
        expect(result.card_cvv).toMatch(
          /^pvlt:detokenize:credit_cards:card_cvv:[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/,
        );
      },
    },
    {
      strategy: 'tokenize-object',
      resultAssertion: (result: Result<'fields'>) => {
        expect(result).toMatch(/^pvlt:detokenize:credit_cards::[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/);
      },
    },
    {
      strategy: 'encrypt-fields',
      resultAssertion: (result: Result<'fields'>) => {
        expect(Object.keys(result)).toEqual(['card_holder', 'card_number', 'card_expiry', 'card_cvv']);
        expect(result.card_holder).toMatch(/^pvlt:decrypt_object:credit_cards:card_holder:[0-9a-zA-Z/+]+={0,2}:$/);
        expect(result.card_number).toMatch(/^pvlt:decrypt_object:credit_cards:card_number:[0-9a-zA-Z/+]+={0,2}:$/);
        expect(result.card_expiry).toMatch(/^pvlt:decrypt_object:credit_cards:card_expiry:[0-9a-zA-Z/+]+={0,2}:$/);
        expect(result.card_cvv).toMatch(/^pvlt:decrypt_object:credit_cards:card_cvv:[0-9a-zA-Z/+]+={0,2}:$/);
      },
    },
    {
      strategy: 'encrypt-object',
      resultAssertion: (result: Result<'fields'>) => {
        expect(result).toMatch(/^pvlt:decrypt_object:credit_cards::[0-9a-zA-Z/+]+={0,2}:$/);
      },
    },
    {
      strategy: 'store-object',
      resultAssertion: (result: Result<'fields'>) => {
        expect(result).toMatch(/^pvlt:read_object:credit_cards::[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}:$/);
      },
    },
  ];

  for (const { strategy, resultAssertion } of strategies) {
    test.describe(`strategy ${strategy}`, () => {
      test('internal submit button', async ({ page }) => {
        const { form } = await prepareProtectedFormTest(page, {
          strategy,
        });

        const log = waitForConsole(page, { message: /^test onSubmit hook: / });
        const responsePromise = page.waitForResponse(`http://localhost:${process.env.VAULT_PORT}/api/**`);

        await form.submitButton.click();

        const response = await responsePromise;
        expect(response.status()).toEqual(200);

        // verify the event hook was called with the tokenized data
        const result = JSON.parse((await log).slice('test onSubmit hook: '.length));
        expect(result).toBeDefined();
        resultAssertion(result);
      });

      test('externally controlled submit', async ({ page }) => {
        const { protectedFormHandle } = await prepareProtectedFormTest(page, {
          strategy,
          submitButton: undefined,
        });

        const log = waitForConsole(page, { message: /^test onSubmit hook: / });
        const responsePromise = page.waitForResponse(`http://localhost:${process.env.VAULT_PORT}/api/**`);

        const promiseResult = await protectedFormHandle.evaluate((form: Form<'fields'>) => form.submit());
        resultAssertion(promiseResult);

        const response = await responsePromise;
        expect(response.status()).toEqual(200);

        // verify the event hook was called with the tokenized data
        const hookResult = JSON.parse((await log).slice('test onSubmit hook: '.length));
        // verify the promise result of calling submit() is the same as the event hook result
        expect(promiseResult).toStrictEqual(hookResult);
      });
    });
  }
});
