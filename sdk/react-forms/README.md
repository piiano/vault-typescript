<p>
  <a href="https://piiano.com/pii-data-privacy-vault/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.piiano.com/img/logo-developers-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://docs.piiano.com/img/logo-developers.svg">
      <img alt="Piiano Vault" src="https://docs.piiano.com/img/logo-developers.svg" height="40" />
    </picture>
  </a>
</p>

# @piiano/react-forms

This is the Piiano Forms SDK for React.

It provides a React components to easily integrate Piiano Forms into your React application.

Piiano Forms make your forms compliant with PCI or any other privacy regulation by tokenizing sensitive data before submitting it to
your backend.

Piiano Forms is a secure way to collect sensitive data from your users without having to worry about the security implications of handling that data yourself.

It allows you to collect sensitive data such as credit card information, social security numbers, and other personal information in a secure way and store it in Piiano Vault.

> **Note:**
>
> This package is compatible with Vault version 1.12.0.
> For a version compatible with other versions of Vault, check [other versions of this package](https://www.npmjs.com/package/@piiano/react-forms?activeTab=versions).

## When to use Piiano Forms

If you want to make sure that your backend never sees sensitive data, but can still use it with relevant services,
Piiano Forms is for you.

- Save credit card details in Vault, and use Vault to pass them to payment gateways when needed without making your
  entire backend PCI compliant.
- Save personal contact information such as phone numbers and emails in Vault, and use Vault to pass them to your
  marketing automation tools so you can send emails and SMS without exposing your customers' contact information to your
  backend and other third parties.
- Save addresses in Vault, and use Vault to pass them to your shipping providers so you can ship products without
  exposing your customers' addresses to your backend and other third parties.

## How it works

Let's take a look at a simple form that collects credit card details for easy payments.

In the naive unsecure approach, a form will submit the card details to your backend where the backend can save them in
the database for future use and per your client demand, send a request to payment service to process the card.
This will require your backend to be PCI compliant which is a lot of work and require a lot of care on how you handle
the card details.

> A partial list of the things you need to do to be PCI compliant if you were to store the card details on your own:
>
> - Payment details are encrypted at rest.
> - Payment details are encrypted in transit.
> - Payment details are not stored in logs.
> - Third party you use to process the payment details is also PCI compliant
> - Third party libraries are up to date and does not have any known vulnerabilities.
> - Full audit of your code and processes to get PCI compliance certification.
> - Full audit log of all access to the payment details.
> - Full permission and access control on any access to payment details.
> - Full network and infrastructure isolation of your environment.
>
> And this is just a partial list...

With Piiano Vault and the Piiano Forms SDK, you can eliminate the need to handle all of this by storing the card details
in Piiano Vault.
Vault can store the card details securely and give you a secured tokens you can pass to your backend instead.
Using the tokens you can then charge the card, without ever exposing the card details to your backend.

## Installation

You can install this package using npm or yarn:

```bash
npm install @piiano/react-forms
```

or

```bash
yarn add @piiano/react-forms
```

## Importing

You can import the components from the package like this:

```tsx
import { ProtectedForm } from '@piiano/react-forms';
```

## Usage

The following example shows how to use the `ProtectedForm` component to collect credit card information from a user and store it in Piiano Vault.

For storing the information we will define a collection in Vault with the following [PVSchema](https://docs.piiano.com/guides/reference/pvschema):

```sql
credit_cards DATA (
    card_cvv CC_CVV,
    card_expiry CC_EXPIRATION_STRING,
    card_holder CC_HOLDER_NAME,
    card_number CC_NUMBER
);
```

> **Note:**
> 
> You can also define the collection from within the [Vault SaaS](https://app.piiano.io/) that provides a UI for defining the schema.

Using the `ProtectedForm` component we can easily define a form that will run in a different browsing context (iframe) and will securely collect the credit card information from the user and store it in the Vault.

Your app can configure the form fields, the Vault URL, the API key, the collection name, and other configuration options.

The form will handle the data collection and storage in the Vault and will call the `onSubmit` callback with tokens for the stored data.

Here is an example of how to use the `ProtectedForm` component:

```tsx
import React, { useCallback, useState } from 'react';
import { ProtectedForm, Result, ResultType } from '@piiano/react-forms';

const fields = [
  { name: 'card_holder', dataTypeName: 'CC_HOLDER_NAME', label: 'Name', required: true, placeholder: 'John Doe' },
  { name: 'card_number', dataTypeName: 'CC_NUMBER', label: 'Card', required: true, placeholder: '4111 1111 1111 1111' },
  { name: 'card_expiry', dataTypeName: 'CC_EXPIRATION_STRING', label: 'Expiry', required: true, placeholder: '12/34' },
  { name: 'card_cvv', dataTypeName: 'CC_CVV', label: 'CVV', required: true, placeholder: '123' },
];

function App() {
  const vaultURL = ''; // Fill this field.
  const apiKey = '';  // Fill this field.
  const [result, setResult] = useState<string>();
  const onError = useCallback((error: Error) => {
    setResult(error.message);
  }, []);
  const onSubmit = useCallback((value: Result<ResultType>) => {
    setResult(JSON.stringify(value, null, 2));
  }, []);

  return (
    <section>
      <h2>Protected form (iframe)</h2>
      <ProtectedForm
        vaultURL={vaultURL}
        apiKey={apiKey}
        collection="credit_cards"
        expiration={15 * 60} // 15 minutes
        fields={fields}
        submitButton="Submit"
        style={{ theme: 'floating-label' }}
        onSubmit={onSubmit}
        onError={onError}
      />
      {result && <pre>{result}</pre>}
    </section>
  );
}
```

## Props

The `ProtectedForm` component accepts the following props:

| Property                 | Type                                    |       Default        | Description                                                                                                                                                                                        |
|--------------------------|-----------------------------------------|:--------------------:|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `vaultURL`               | `string`                                |         N/A          | The URL of your Vault.                                                                                                                                                                             |
| `apiKey`                 | `string`                                |         N/A          | The API key to use to access the Vault. Make sure to use a key that has access to the `tokenize` endpoint only and not read or detokenize Vault data since this key will be exposed to the client. |
| `ref`                    | `React.RefObject<Form<any>>` (optional) |         N/A          | A ref to the form handler instance. This can be used to programmatically submit the form instead of using the submit button provided by the form.                                                  |
| `allowUpdates`           | `boolean` (optional)                    |       `false`        | Whether to allow updates to the form after it has been initialized. Default is `false`. If you require updates to the form configuration dynamically after initialization, set this to `true`.     |
| `debug`                  | `boolean` (optional)                    |       `false`        | Print debug information to console. This will not print sensitive information.                                                                                                                     |
| `strategy`               | `string` (optional)                     | `"toeknize-fields"`  | The strategy to use to submit the form. See [supported strategies](#supported-strategies).                                                                                                         |
| `globalVaultIdentifiers` | `boolean` (optional)                    |        `true`        | Whether to use global vault identifiers in returned values.                                                                                                                                        |
| `collection`             | `string`                                |         N/A          | The name of the collection to store the tokenized data in.                                                                                                                                         |
| `fields[*].name`         | `string`                                |         N/A          | The name of the field as defined in the collection schema.                                                                                                                                         |
| `fields[*].dataTypeName` | `string`                                |         N/A          | The data type for the field as defined in the collection schema.                                                                                                                                   |
| `fields[*].label`        | `string` (optional)                     |         N/A          | The label for the field to display in the form.                                                                                                                                                    |
| `fields[*].required`     | `boolean`                               |       `false`        | Whether the field is required or not.                                                                                                                                                              |
| `fields[*].placeholder`  | `string` (optional)                     |         N/A          | The placeholder text for the field.                                                                                                                                                                |
| `fields[*].value`        | `string` (optional)                     |         N/A          | The initial value for the field.                                                                                                                                                                   |
| `tenantId`               | `string` (optional)                     |         N/A          | If you are using a multi-tenant Vault, you can specify the tenant ID to use for this form.                                                                                                         |
| `reason`                 | `string` (optional)                     | `"AppFunctionality"` | The reason for the tokenization. This will be used by the Vault to audit the tokenization. Defaults to `AppFunctionality`.                                                                         |
| `expiration`             | `number` (optional)                     |         N/A          | The time in seconds for the token/object/ciphertext to expire. If not provided, the default expiration time of the Vault will be used. Set to `-1` for no expiration.                              |
| `submitButton`           | `string` (optional)                     |         N/A          | The name of the submit button. If provided, a submit button will be rendered. If not provided, the form is expected to be submitted programmatically by the form handler.                          |
| `style.theme`            | `string` (optional)                     |     `"default"`      | The theme to use for the form. Can be one of the following: `default` - Default theme, `floating-label` - Floating label theme, `none` - No theme.                                                 |
| `style.css`              | `string` (optional)                     |         N/A          | Custom CSS to apply to the form.                                                                                                                                                                   |
| `style.variables`        | `Record<string, string>` (optional)     |         N/A          | Custom CSS variables to apply to the form. Available variables from the themes are: `primary`, `primaryDark`, `background`, `focusBackground`, `placeholderColor`, and `borderColor`.              |

### Supported Strategies

The `strategy` prop can be one of the following:

| Value                       | Description                                                                             |
|-----------------------------|-----------------------------------------------------------------------------------------|
| `tokenize-fields` (default) | Tokenize each field independently and return a token for each field.                    |
| `tokenize-object`           | Tokenize the entire object and return a single token.                                   |
| `encrypt-fields`            | Encrypt each field independently and return an object with a ciphertext for each field. |
| `encrypt-object`            | Encrypt the entire object and return a single encrypted object ciphertext.              |
| `store-object`              | Store the entire object and return an object ID.                                        |

## Peer Dependencies

This package has the following peer dependencies:

- `react`: The React library
- `react-dom`: The React DOM library

## License

This package is licensed under the MIT License.
See the [LICENSE](../../LICENSE) file for more information.
