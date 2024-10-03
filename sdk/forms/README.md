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

Make your forms compliant with PCI or any other privacy regulation by tokenizing sensitive data before submitting it to
your backend.

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

Let's take a look at the form:

```html
<form action="/cards" method="post">
  <h1>Add payment details</h1>
  <label for="card_number">Card Number</label>
  <input type="text" id="card_number" name="card_number" />
  <label for="card_holder">Card Holder</label>
  <input type="text" id="card_holder" name="card_holder" />
  <label for="card_expiry">Card Expiry</label>
  <input type="text" id="card_expiry" name="card_expiry" />
  <label for="card_cvv">Card CVV</label>
  <input type="text" id="card_cvv" name="card_cvv" />
  <button type="submit">Add card</button>
</form>
```

The form is pretty standard, but we need to add a few things to make it work with Piiano Forms.

First, we need to include the Piiano Forms SDK using one of the following methods:
- Include the SDK from Piiano CDN by including the Piiano Forms SDK in the head of the page:
  ```html
  <script src="https://cdn.piiano.com/pvault-forms-lib-v1.0.36.js"></script>
  ```
- Install the SDK using npm:
  ```bash
  npm install @piiano/forms
- Install the SDK using yarn:
  ```bash
  yarn add @piiano/forms
  ```

Next, add a `data-piiano-proxy-options` attribute to the form and set it to a JSON configuration object:

```html
<form
  action="/cards"
  method="post"
  data-piiano-proxy-options='{
        "collection":"credit_cards",
        "hijack":true,
        "vaultURL":"https://xxxxxxxxxx.us-east-2.awsapprunner.com"
      }'
>
  <h1>Add payment details</h1>
  <label for="card_number">Card Number</label>
  <input type="text" id="card_number" name="card_number" />
  <label for="card_holder">Card Holder</label>
  <input type="text" id="card_holder" name="card_holder" />
  <label for="card_expiry">Card Expiry</label>
  <input type="text" id="card_expiry" name="card_expiry" />
  <label for="card_cvv">Card CVV</label>
  <input type="text" id="card_cvv" name="card_cvv" />
  <button type="submit">Add card</button>
</form>
```

With this configuration, the form will be submitted by Piiano Forms SDK to the Vault instead of your backend.
The form will be submitted to the `vaultURL` you specified in the configuration and the data will be stored in
the `collection` you specified.

The `hijack` option is used to tell the SDK to hijack the form original submit events and resubmit the forms to the
original destination only once the card details are tokenized.

The SDK will intercept the form submission and tokenize the card details, then it will submit the form to your backend
with the card details replaced with the tokenized values.

To get a Vault URL, you need to create a Piiano account and create a new Vault.
You can get a new Vault by registering to our Vault SaaS at https://app.piiano.io.

## Configuration

The `data-piiano-proxy-options` attribute supports the following configuration options:

- `vaultURL` - `string` - The URL of your Vault.
- `apiKey` - `string` - The API key to use to access the Vault. Make sure to use a key that has access to the `tokenize`
  endpoint only and not read or detokenize Vault data since this key will be exposed to the client.
- `collection` - `string` - The name of the collection to store the tokenized data in.
- `hijack` - `boolean` - If set to `true`, the SDK will hijack the form submission and submit the form once the card
  details are tokenized. Otherwise, the SDK will only tokenize the card details and will not submit the form.
- `reason` - `string` - The reason for the tokenization. This will be used by the Vault to audit the tokenization.
  Defaults to `AppFunctionality`.
- `tenantId` - `string` - If you are using a multi-tenant Vault, you can specify the tenant ID to use for this form.
