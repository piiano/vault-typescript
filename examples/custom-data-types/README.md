# @piiano/custom-data-types

This example demonstrates how to define custom data types using a bundle defined with the `@piiano/vault-bundles` package.

## Overview

- `src/index.ts` - This is the example bundle to be tested, written in TypeScript.
- `test`
  - `hooks.ts` - Defines global hooks for the test to start a local Dev edition of Vault and stop it at the end of the test.
  - `custom-data-types.spec.ts`- A test that adds the bundle to the vault, creates a custom data type, creates a collection that uses it, and tests adding objects with a property that uses the custom data type (passing validations) and reading the normalized & transformed version of the property.
  `package.json`- Defines dependencies for compiling the bundle from TypeScript to JavaScript, `@piiano/vault-bundles` for bundle type definitions, test framework dependencies (mocha, chai, etc.), `@piiano/testcontainers-vault` and `@piiano/vault-client` for testing the bundle with a local Vault, and scripts for testing and building the bundle.

## Running the example

To run the example, please follow these steps:

1. Clone the repository and navigate to this directory.
   ```bash
   git clone https://github.com/piiano/vault-typescript.git
   cd vault-typescript/examples/custom-data-types
   ```
2. Set the `PVAULT_SERVICE_LICENSE` environment variable to a valid Piiano Vault license key.

   You can obtain a free trial license key [here](https://docs.piiano.com/guides/get-started/).
3. Install the dependencies
   ```bash
    yarn
    ```
4. Build the bundle defined in [index.ts](./src/index.ts)
   ```bash
    yarn build
    ```
   
5. Run the [custom-data-types.spec.ts](./test/custom-data-types.spec.ts) that shows how to define a custom data type using the bundle and how to use it.
   ```bash
    yarn test
    ```

## About Piiano Vault

Piiano Vault is the secure home for sensitive personal data. It allows you to safely store sensitive personal data in your own cloud environment with automated compliance controls.

Vault is deployed within your own architecture, next to other DBs used by the applications, and should be used to store the most critical sensitive personal data, such as credit cards and bank account numbers, names, emails, national IDs (e.g. SSN), phone numbers, etc.

The main benefits are:

- Field level encryption, including key rotation.
- Searchability is allowed over the encrypted data.
- Full audit log for all data accesses.
- Granular access controls.
- Easy masking and tokenization of data.
- Out of the box privacy compliance functionality.

More details can be found [on our website](https://piiano.com/pii-data-privacy-vault/) and on the [developers portal](https://docs.piiano.com/).

## Issues and Feedback

If you encounter any issues or have feedback, please feel free to open an issue on this GitHub repository. We appreciate your contributions and suggestions for improvement!
