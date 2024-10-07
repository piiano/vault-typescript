<p>
  <a href="https://piiano.com/pii-data-privacy-vault/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.piiano.com/img/logo-developers-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://docs.piiano.com/img/logo-developers.svg">
      <img alt="Piiano Vault" src="https://docs.piiano.com/img/logo-developers.svg" height="40" />
    </picture>
  </a>
</p>

# @piiano/forms

Make your forms compliant with PCI or any other privacy regulation by securely managing sensitive data before submitting it to your backend. Using `@piiano/forms`, you can tokenize, encrypt, or store sensitive data directly in Piiano Vault without exposing it to your backend.

## Table of Contents

- [When to Use Piiano Forms](#when-to-use-piiano-forms)
  - [Example Use Cases](#example-use-cases)
- [How It Works](#how-it-works)
- [API](#api)
  - [createProtectedForm](#createprotectedform)
    - [Overview](#overview)
    - [Goal](#goal)
    - [Usage](#usage)
  - [createProtectedView](#createprotectedview)
    - [Overview](#overview-1)
    - [Goal](#goal-1)
    - [Usage](#usage-1)
  - [controlForm](#controlform)
    - [Overview](#overview-2)
    - [Goal](#goal-2)
    - [Usage](#usage-2)
- [Recommended Vault Authorization Techniques](#recommended-vault-authorization-techniques)
- [Benefits of Using Piiano Vault with Piiano Forms](#benefits-of-using-piiano-vault-with-piiano-forms)
- [Getting Started](#getting-started)

## When to Use Piiano Forms

Piiano Forms is ideal for any use case where you want to collect sensitive information (e.g., credit card details, personal contact information) securely and make sure that it does not reach your backend in raw form.

### Example Use Cases:

- **Credit Card Payments**: Save credit card details in Vault and use Vault to pass them to payment gateways when
  needed, without making your entire backend PCI compliant.
- **Marketing Automation**: Save personal contact information like phone numbers and emails in Vault, and use Vault to
  send it to marketing tools for sending emails and SMS, without exposing this data to your backend.
- **Shipping Addresses**: Store addresses in Vault, and use it to pass them to shipping providers for deliveries,
  maintaining complete privacy.

## How It Works

Piiano Forms interacts exclusively with Piiano Vault, ensuring that all sensitive data is securely tokenized, encrypted, or stored before any further processing. This interaction happens directly between the form and Piiano Vault, without involving your backend. This approach is beneficial as:

1. The Vault can be configured to allow communication only from the allowed origin of the form.
2. The form iframe is served with strict CSP (Content Security Policy) headers, making it a sandbox that prevents PII from leaking out, while allowing exclusive communication with the Vault.

This architecture ensures that even if the user frontend is compromised (e.g., via a malicious package or XSS attack), the attacker cannot access the iframe content or manipulate the communication with the Vault.

## API

### `createProtectedForm`

#### Overview

`createProtectedForm` allows you to create and manage a secure form for collecting sensitive data like credit card information or personally identifiable information (PII). This form handles the entire interaction with Piiano Vault, ensuring secure storage, encryption, or tokenization of data.

#### Goal

Use `createProtectedForm` when you need to securely collect and manage sensitive data, and wish to ensure that it is processed securely by Piiano Vault. This function is suitable when you do not want the backend to handle raw PII.

#### Usage

##### Parameters

- `selector`: A CSS selector or an HTML container element where the form will be rendered.
- `options`: An object containing configuration options:
  - `vaultURL` (string): The URL of the Piiano Vault instance.
  - `apiKey` (string): API key for interacting with the Vault.
  - `fields` (array): Field definitions specifying field names, labels, data types, etc.
  - `strategy` (optional string): Strategy for handling data:
    - `"tokenize-fields"` or `"store-object"`: Stores data in the Vault and returns an object ID or token ID.
    - `"encrypt-object"`: Uses the Vault to encrypt the data and return a ciphertext in base64 format.
  - `submitButton` (optional string): Text for the automatically generated submit button.
  - `style` (optional object): Custom styles for the form.
  - `hooks` (optional object): Hooks to manage the form lifecycle:
    - `onSubmit(result)`: Called when the form is submitted successfully. Use the response (object ID/token ID/ciphertext) for further processing.
    - `onError(error)`: Called when an error occurs.

##### Returned Object

The `createProtectedForm` function returns an object that provides the following methods:

- `destroy()`: Removes the form instance from the DOM.
- `update(options)`: Updates form configuration.
- `submit()`: Programmatically submits the form and returns the result.

##### Usage Example

```javascript
import {createProtectedForm} from '@piiano/forms';

const form = createProtectedForm('#form-container', {
  vaultURL: 'https://your-vault-url.com',
  apiKey: 'your-api-key',
  fields: [
    {name: 'card_number', label: 'Card Number', dataTypeName: 'CC_NUMBER', required: true},
    {name: 'card_holder', label: 'Card Holder', dataTypeName: 'CC_HOLDER_NAME', required: true},
  ],
  strategy: 'tokenize-fields',
  submitButton: 'Submit Payment',
  hooks: {
    onSubmit: (result) => {
      console.log('Form submitted with tokenized data:', result);
      // Store the token ID or object ID in your database
    },
    onError: (error) => {
      console.error('Error during form submission:', error);
    },
  },
});
```

### `createProtectedView`

#### Overview

`createProtectedView` creates a secure view component to display sensitive data stored in Piiano Vault, ensuring that sensitive data is never directly exposed to the frontend.

#### Goal

Use `createProtectedView` when you need to securely display sensitive data on the frontend without exposing raw data.

#### Usage

##### Parameters

- `selector`: A CSS selector or an HTML container element where the view will be rendered.
- `options`: Configuration options:
  - `vaultURL` (string): The URL of the Piiano Vault instance.
  - `apiKey` (string): API key for accessing the Vault.
  - `collection` (string): Name of the collection containing the data.
  - `objects` (array): IDs of objects to be displayed.
  - `props` (array): Properties to display from each object.
  - `style` (optional object): Custom styles.

##### Returned Object

The `createProtectedView` function returns an object that provides:

- `destroy()`: Removes the view instance from the DOM.
- `update(options)`: Updates the view’s configuration.

##### Usage Example

```javascript
import {createProtectedView} from '@piiano/forms';

const view = createProtectedView('#view-container', {
  vaultURL: 'https://your-vault-url.com',
  apiKey: 'your-api-key',
  collection: 'customers',
  objects: ['customer-id-123'],
  props: ['name', 'email'],
  style: {
    css: `
      .customer-info { font-weight: bold; }
    `,
  },
});
```

### `controlForm`

#### Overview

`controlForm` enhances an existing form element, allowing secure data processing through Piiano Vault. It ensures that sensitive fields are securely encrypted, tokenized, or stored before submission, but without creating a sandboxed environment.

#### Goal

Use `controlForm` to add secure handling to an existing form without redesigning it from scratch. This method is ideal for forms that need basic security, such as marketing forms, where sensitive data should be protected but compliance requirements like PCI do not apply.

#### Usage

##### Parameters

- `formOrSelector`: A CSS selector or an HTML form element to control.
- `options`: Configuration options:
  - `vaultURL` (string): URL of the Piiano Vault instance.
  - `apiKey` (string): API key for interacting with the Vault.
  - `strategy` (optional string): Strategy for handling data (e.g., `"encrypt-fields"`).
  - `replayOriginalEvents` (optional boolean): Whether to replay the original form submission event after tokenization.
  - `hooks` (optional object): Lifecycle hooks:
    - `onSubmit(result)`: Called on successful form submission. The response should be used for further processing.
    - `onError(error)`: Called when an error occurs.

> **Note**
> Unlike `createProtectedForm` and `createProtectedView`, `controlForm` does not create a sandbox for the form using an
  iframe.
> Instead, it simply intercepts form submit events. As a result, this option is recommended for marketing forms
  but is **not suitable for use cases requiring PCI compliance**.

##### Usage Example

```javascript
import {controlForm} from '@piiano/forms';

controlForm('#existing-form', {
  vaultURL: 'https://your-vault-url.com',
  apiKey: 'your-api-key',
  strategy: 'encrypt-fields',
  replayOriginalEvents: true,
  hooks: {
    onSubmit: (result) => {
      console.log('Controlled form submitted with encrypted data:', result);
      // Store the ciphertext or token ID in your database
    },
    onError: (error) => {
      console.error('Error during controlled form submission:', error);
    },
  },
});
```

## Recommended Vault Authorization Techniques

To further enhance the security of your integration with Piiano Vault, it is recommended to apply advanced Vault authorization techniques alongside this library:

- **Minimize Permissions**: Limit the API key permissions to allow only the necessary operations (e.g., tokenization or encryption) and avoid excessive access.
- **Use JWTs Instead of API Keys**: Use JSON Web Tokens (JWTs) to enforce fine-grained authorization rules. JWTs can include enforcements that restrict users to insert or read only the data they own. This is especially important when using `createProtectedView` to ensure that data access is scoped appropriately.

## Benefits of Using Piiano Vault with Piiano Forms

- **Security**: Sensitive data is never exposed to your backend; it’s handled directly by Piiano Vault.
- **Privacy Compliance**: Easily meet privacy regulations (e.g., PCI) by securing sensitive data through tokenization, encryption, and safe storage.
- **Minimized Risk**: By isolating sensitive data collection in a secure iframe, the risk of compromise through frontend vulnerabilities (such as XSS attacks) is significantly reduced.

## Getting Started

- [Set Up Vault](https://piiano.com/docs/setup) to start collecting, storing, and managing sensitive data securely.
- Install `@piiano/forms` via npm or yarn and follow the examples above to integrate secure forms into your application.
