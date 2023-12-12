import {expect, test} from '@playwright/test';
import {dirname, resolve} from 'path'
import {fileURLToPath} from 'url'
import {createServer, ViteDevServer} from 'vite'
import {AddressInfo} from "node:net";

// @ts-ignore
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

let url: string;
let server: ViteDevServer;

test.beforeAll(async () => {
  // Start the vite dev server programmatically.
  server = await createServer({
    configFile: resolve(rootDir, 'vite.config.ts'),
    root: rootDir,
  })
  await server.listen()
  const {port} = (server?.httpServer?.address() as AddressInfo)
  url = `http://localhost:${port}/`
})

test.afterAll(async () => {
  await server.close()
})

test('submitting the forms tokenize the data', async ({page}) => {
  await page.goto(url);

  const cardNumberInput = page.getByLabel('Card Number')
  const cardHolderInput = page.getByLabel('Card Holder')
  const cardExpiryInput = page.getByLabel('Card Expiry')
  const cardCVVInput = page.getByLabel('Card CVV')

  for (const {input, value} of [{
    input: cardNumberInput,
    value: "4111111111111111",
  }, {
    input: cardHolderInput,
    value: "Jane Doe",
  }, {
    input: cardExpiryInput,
    value: "12/25",
  }, {
    input: cardCVVInput,
    value: "123",
  }]) {
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()
    await expect(input).toBeEditable()
    await expect(input).toHaveValue(value)
  }

  // Listen to the console event to verify the original submit handler was called once the form was submitted.
  const consoleEvent = page.waitForEvent('console');

  const submitButton = page.getByRole('button', {name: 'Pay/Add card'});
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()
  await submitButton.click()

  // Submitting the form should arrive to the backend which simply echos back the request so we can verify the data got tokenized.
  const formSubmissionResponse = page.getByText('Got:');

  await expect(formSubmissionResponse).toBeVisible()
  const formSubmissionResponseText = await formSubmissionResponse.innerText()
  const backendDataReceived = JSON.parse(formSubmissionResponseText?.slice('Got:'.length))

  expect(backendDataReceived.method).toEqual('POST')
  expect(Object.keys(backendDataReceived.body)).toEqual(['card_number', 'card_holder', 'card_expiry', 'card_cvv'])

  for (const value of Object.values(backendDataReceived.body)) {
    // expect all values to be tokens
    expect(value).toMatch(/^[0-9a-z]{8}-([0-9a-z]{4}-){3}[0-9a-z]{12}$/)
  }

  const consoleMessage = (await consoleEvent).text();
  // The original submit handler (which log the form data to the logs) should have been called and should receive the form data tokenized.
  expect(consoleMessage).toMatch(/my original on submit handler/g)
  expect(consoleMessage).toMatch(/card_number: [0-9a-z]{8}-([0-9a-z]{4}-){3}[0-9a-z]{12}/g)
});
