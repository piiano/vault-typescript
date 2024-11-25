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
- [Setup](#setup)
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

- **Credit Card Payments**: Save credit card details in Vault and use Vault to pass them to payment gateways when needed, reducing the effort of making your application PCI compliant.
- **Marketing Automation**: Save personal contact information like phone numbers and emails in Vault, and use Vault to send it to marketing tools for sending emails and SMS, without exposing this data to your backend.
- **Shipping Addresses**: Store addresses in Vault, and use it to pass them to shipping providers for deliveries, maintaining complete privacy.
- **Protected Data View**: Create a protected view for displaying sensitive data from the Vault or from third party services directly in your UI without exposing the data to your application directly.

## How It Works

Piiano Forms interacts exclusively with Piiano Vault, ensuring that all sensitive data is securely tokenized, encrypted, or stored before any further processing. This interaction happens directly between the form and Piiano Vault, without involving your backend. This approach is beneficial as:

1. The Vault can be configured to allow communication only from the allowed origin of the form.
2. The form iframe is served with strict CSP (Content Security Policy) headers, making it a sandbox that prevents PII from leaking out, while allowing exclusive communication with the Vault.

This architecture ensures that even if the parent browsing context is compromised (e.g., via a malicious package or XSS attack), the attacker cannot access the iframe content or manipulate the communication with the Vault.

## Setup

To use Piiano Forms, you need to have a Piiano Vault instance set up.

If you don’t have one, you can [sign up for a free sandbox vault](https://app.piiano.io/register) to get started.

Once you have your Vault set up, you can include the `@piiano/forms` package in your project with a package manager or directly from our CDN.

### `npm`

```bash
npm install @piiano/forms
```

### `yarn`

```bash
yarn add @piiano/forms
```

### `pnpm`

```bash
pnpm add @piiano/forms
```

### CDN

```html
<script src="https://cdn.piiano.com/pvault-forms-lib-v2.2.3.js"></script>
```

> **Note**
> 
> The CDN version of the library is available in few versions:
> - `pvault-forms-lib-latest.js`: The latest version of the library.
> - `pvault-forms-lib-vX.js`: The latest version with the vX major version.
> - `pvault-forms-lib-vX.Y.js`: The latest version in the vX.Y major & minor version.
> - `pvault-forms-lib-vX.Y.Z.js`: Get an exact version of the library by specifying the full version number.
> 
> It is recommended to use the specific version of the library in production and not the latest version to avoid breaking changes.
> To get a list of the versions available, you can check the [@piiano/forms](https://www.npmjs.com/package/@piiano/forms?activeTab=versions) package versions page.

## API

### `createProtectedForm`

#### Overview

`createProtectedForm` enables you to create and manage a secure form for collecting sensitive data, such as credit card information or personally identifiable information (PII). The form handles the entire interaction with Piiano Vault, ensuring that sensitive data is securely transmitted, stored, and protected through encryption or tokenization.

#### Goal

Use `createProtectedForm` when you need to securely collect and process sensitive data, while ensuring that neither your frontend nor backend systems directly handle the raw data. This method is particularly useful for meeting regulatory compliance requirements, as it reduces the exposure of sensitive information across your system. By isolating sensitive data handling within Piiano Vault, `createProtectedForm` minimizes the effort needed to certify your environment for handling sensitive data, as most components won’t have direct access to the raw data by default.

#### Usage

##### Parameters

- `selector`: A CSS selector or an HTML container element where the form will be rendered.
- `options`: An object containing configuration options:
  - `vaultURL` (string): The URL of the Piiano Vault instance.
  - `apiKey` (string): API key for interacting with the Vault.
  - `collection` (string): Name of the collection where the data will be stored.
  - `fields` (array): Field definitions specifying field names, labels, data types, etc.
  - `strategy` (optional string): Strategy for handling data:
    - `"tokenize-object"`: Tokenize the entire object and return a single token.
    - `"tokenize-fields"`: Tokenize each field independently and return a token for each field.
    - `"encrypt-object"`: Encrypt the entire object and return a single encrypted object ciphertext.
    - `"encrypt-fields"`: Encrypt each field independently and return an object with a ciphertext for each field.
    - `"store-object"`: Store the entire object and return an object ID.
  - `globalVaultIdentifiers` (optional boolean): Whether to use [global vault identifiers](https://docs.piiano.com/guides/reference/http-call-request#vault-global-identifier) in returned values.
  - `reason` (optional string): Reason used when sending the data to the Vault (will be logged in the Vault audit logs).
  - `submitButton` (optional string): Text for the automatically generated submit button.
  - `style` (optional object): Custom styles for the form.
    - `css` (optional string): Custom CSS styles to be added to the form.
  - `hooks` (optional object): Hooks to manage the form lifecycle:
    - `onSubmit(result)`: Called when the form is submitted successfully. Use the response (object ID/token ID/ciphertext) for further processing.
    - `onError(error)`: Called when an error occurs.
  - `debug` (optional boolean): Whether to enable debug mode which adds additional logging (default: `false`).
  - `allowUpdates` (optional boolean): Whether to allow updates to the form after it has been initialized (default: `false`).

##### Returned Object

The `createProtectedForm` function returns an object that provides the following methods:

- `destroy()`: Removes the form instance from the DOM.
- `update(options)`: Updates form configuration. For the `update` method to work, the `allowUpdates` option must be set to `true` in the initial configuration.
- `submit()`: Programmatically submits the form and returns the result as a Promise.

##### Usage Example

```javascript
import {createProtectedForm} from '@piiano/forms';

const form = createProtectedForm('#form-container', {
  vaultURL: 'https://your-vault-url.com',
  apiKey: 'your-api-key',
  collection: 'payments',
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

`createProtectedView` generates a secure view component for displaying sensitive data retrieved from Piiano Vault. This ensures that while the data is visible to the user, it remains protected from access by other client-side code, such as third-party scripts, browser extensions, or external dependencies.

#### Goal

Use `createProtectedView` when you need to securely display sensitive data on the frontend. The data is rendered within a protected environment, making it inaccessible to other frontend or backend components. This approach can be particularly useful for meeting regulatory compliance requirements, as it limits data exposure to only the protected view. By keeping sensitive data isolated, you reduce the amount of work needed to certify most of your environment for handling sensitive information, since most components won’t have direct access to the data by default.

#### Usage

##### Parameters

- `selector`: A CSS selector or an HTML container element where the view will be rendered.
- `options`: Configuration options:
  - `vaultURL` (string): The URL of the Piiano Vault instance.
  - `apiKey` (string): API key for accessing the Vault.
  - `strategy` (object): Strategy options for getting data from the Vault:
    - `type` (string): Type of the strategy. Can be either `"read-objects"` or `"invoke-action"`.
      The rest of the configuration depends on the strategy type:
      - When type is `"read-objects"` the view will read objects from the Vault and display them in the view. The following additional strategy options are required:
        - `collection` (string): Name of the collection containing the data.
        - `ids` (string array): IDs of objects to be displayed.
        - `props` (string array): Properties to display from each object.
          Each property can be provided as is or with a transformation (e.g., `name`, `email`, `email.mask`, etc.).
          The order of properties in the array determines the order in which they will be displayed in the view.
        - `transformationParam` (optional string): An extra transformation param to be sent to the Vault and be available in the transformation functions. When multiple parameters are needed, they can be passed as a JSON string and parsed in the transformation functions.
        - `reason` (string): Reason for accessing the data (will be logged in the Vault audit logs).
      - When type is `"invoke-action"` the view will invoke an action in the Vault and display the result in the view. The following additional strategy options are required:
        - `action` (string): Name of the action to invoke.
        - `input` (Record<string, unknown>): Input parameters to be sent to the action and be available in the action code.
        - `reason` (string): Reason for invoking the action (will be logged in the Vault audit logs). 
  - `display` (object array): Array of paths from the response returned from the Vault that should be displayed in the view. Each object in the array should have the following properties:
    - `path` (string): Path to the property in the vault response using JSON path syntax where `.` is used to separate nested properties, `[0]` is used to access array elements and `["key"]` is used to access object properties with special characters.
    - `label` (optional string): Label to display for the property. If not provided, no label will be displayed.
    - `class` (optional string): CSS class to apply to the property element.
    - `clickToCopy` (optional boolean): Whether to enable click-to-copy functionality for the property value.
    - `format` (optional string): A format pattern to apply to the value.
      The format pattern supports the following tokens:
      - `#` for showing a character if present.
      - `*` or `•` for masking a character if present.
      - `~` for skipping a character if present.
      - Any other character in the pattern will be displayed as is in between the original value characters.

      For example, given a value of: `abc123456`
      and a pattern of: `(###) ** ~~##`
      the value will be displayed as: `(abc) ** 56`.

      If a format is provided for a non-primitive value (object or array), the format will be applied to each of the nested primitive values of the object or array.
  - `css` (optional string): Custom CSS styles to be added to the view.
  - `dynamic` (optional boolean): Whether the view allows dynamic updates (default: `false`).
  - `hooks` (optional object): Lifecycle hooks:
    - `onError(error)`: Called when an error occurs.
    - `onClick(event)`: Called when a value click occurs. See [MouseEvent](#mouse-event-object) for more details about the event object.
    - `onMouseEnter(event)`: Called when a value is hovered over. See [MouseEvent](#mouse-event-object) for more details about the event object.
    - `onMouseLeave(event)`: Called when a value is no longer hovered over. See [MouseEvent](#mouse-event-object) for more details about the event object.
  - `debug` (optional boolean): Whether to enable debug mode which adds additional logging (default: `false`).

###### MouseEvent

When `onClick`, `onMouseEnter`, or `onMouseLeave` hooks are called, the event object will have the following properties:
  - `path`: The path to the value that received the event.
  - `mouseX`: x coordinate of the mouse pointer during the event.
  - `mouseY`: y coordinate of the mouse pointer during the event.
  - `rect`: A [DOMRect](https://developer.mozilla.org/en-US/docs/Web/API/DOMRect) element representing the bounding rectangle of the value element that received the event.

##### Returned Object

The `createProtectedView` function returns a View object that has the following methods:

- `destroy()`: Removes the view instance from the DOM.
- `update(options)`: Updates the view’s configuration. For the `update` method to work, the `dynamic` option must be set to `true` in the initial configuration.

##### Usage Example

```javascript
import {createProtectedView} from '@piiano/forms';

const view = createProtectedView('#view-container', {
  vaultURL: 'https://your-vault-url.com',
  apiKey: 'your-api-key',
  strategy: {
    type: 'read-objects',
    collection: 'customers',
    ids: ['b8a42023-b63e-42a8-a3c4-c0cdfad2b755'],
    props: ['name', 'email', 'email.mask'],
  },
  display: [
    { path: '[0].name', label: 'Name' },
    { path: '[0].email', label: 'Email' },
    { path: '[0].["email.mask"]', label: 'Masked Email' },
  ],
  css: `.view { font-weight: bold; }`,
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
  - `collection` (string): Name of the collection where the data will be stored.
  - `strategy` (optional string): Strategy for handling data:
    - `"tokenize-object"`: Tokenize the entire object and return a single token.
    - `"tokenize-fields"`: Tokenize each field independently and return a token for each field.
    - `"encrypt-object"`: Encrypt the entire object and return a single encrypted object ciphertext.
    - `"encrypt-fields"`: Encrypt each field independently and return an object with a ciphertext for each field.
    - `"store-object"`: Store the entire object and return an object ID.
  - `globalVaultIdentifiers` (optional boolean): Whether to use [global vault identifiers](https://docs.piiano.com/guides/reference/http-call-request#vault-global-identifier) in returned values.
  - `reason` (optional string): Reason used when sending the data to the Vault (will be logged in the Vault audit logs).
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
  collection: 'marketing',
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

- **Minimize Permissions**: [Limit the roles permissions](https://docs.piiano.com/guides/manage-users-and-policies/how-iam-works) to allow only the necessary operations (e.g., tokenization or encryption) and avoid excessive access.
- **Use JWTs Instead of API Keys**: [Use JSON Web Tokens](https://docs.piiano.com/guides/manage-users-and-policies/direct-jwt-authentication) (JWTs) to enforce fine-grained authorization rules. JWTs can include enforcements that restrict users to insert or read only the data they own. This is especially important when using `createProtectedView` to ensure that data access is scoped appropriately.

## Benefits of Using Piiano Vault with Piiano Forms

- **Security**: Sensitive data is never exposed to your backend; it’s handled directly by Piiano Vault.
- **Privacy Compliance**: Easily meet privacy regulations (e.g., PCI) by securing sensitive data through tokenization, encryption, and safe storage.
- **Minimized Risk**: By isolating sensitive data collection in a secure iframe, the risk of compromise through frontend vulnerabilities (such as XSS attacks) is significantly reduced.

## Getting Started

- [Set Up Vault](https://piiano.com/docs/setup) to start collecting, storing, and managing sensitive data securely.
- Install `@piiano/forms` via `npm`, `yarn` or `pnpm`, and follow the examples above to integrate secure forms into your application.
