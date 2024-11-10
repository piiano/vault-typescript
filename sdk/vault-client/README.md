# @piiano/vault-client

This is a TypeScript client to connect to a Piiano Vault. It provides an easy-to-use API for accessing the various resources exposed by the Vault [REST API](https://docs.piiano.com/api).

> **Note:**
> 
> This package is compatible with Vault version 1.13.2.
> For a Vault client compatible with other versions of Vault, check [other versions of this package](https://www.npmjs.com/package/@piiano/vault-client?activeTab=versions).

## Installation

To install the package using `npm`:

```bash
npm install @piiano/vault-client
```

To install the package using `yarn`:

```bash
yarn add @piiano/vault-client
```

To install the package using `pnpm`:

```bash
pnpm add @piiano/vault-client
```

## Usage

To use the `VaultClient` class, first import it into your project:

```javascript
const { VaultClient } = require('@piiano/vault-client');
```

Or if you are using TypeScript:

```typescript
import { VaultClient } from '@piiano/vault-client';
```

Then create a new instance of the client:

```javascript
const client = new VaultClient({
  vaultURL: 'https://vault.example.com:8123',
  apiKey: 'vaultApiKey',
});
```

ℹ️ Note that the `VaultClient` options have default values for the `vaultURL` and `apiKey` properties.  
These match the defaults of a local Vault installation in development mode.

```javascript
const defaultOptions = {
  vaultURL: "http://localhost:8123",
  apiKey: "pvaultauth",
}
```

## Usage Example

To get the version of the running Vault: 
```javascript
const version = await this.vaultClient.system.getVaultVersion();
console.log(version);
```

Expected output:
```javascript
{
  vault_id: '165147695309533184',
  vault_version: '1.2.2.4420853466-g3a086a1',
  db_schema_version: 20230314205727
}
```

## Development

To build and test the project:
```commandLine
pnpm i
pnpm run build
pnpm run test
```

## API

The `VaultClient` class includes members for the following specific API categories:

```javascript

const vaultClient = new VaultClient();

vaultClient.collections // client for working with collections
vaultClient.collectionProperties // client for working with collection properties
vaultClient.objects // client for working with objects
vaultClient.crypto // client for working with crypto operations
vaultClient.tokens // client for working with tokens
vaultClient.system // client for working with system operations
vaultClient.iam // client for working with IAM
vaultClient.configVars // client for working with config vars
vaultClient.dataTypes // client for working with data types
vaultClient.bundles // client for working with bundles
```

These correspond to the various resources exposed by the Piiano Vault REST API.
Each member provides methods for interacting with the corresponding resource.

### `VaultClient.collections`

This Piiano Vault resource enables you to create, retrieve, update, and delete the collections that hold sensitive data.
  
- `VaultClient.collections.listCollections()`
- `VaultClient.collections.addCollection()`
- `VaultClient.collections.getCollection()`
- `VaultClient.collections.updateCollection()`
- `VaultClient.collections.deleteCollection()`

### `VaultClient.collectionProperties`

description: This Piiano Vault resource enables you to create, retrieve, list, update, and delete the collection properties that define the stored data values.

- `VaultClient.collectionProperties.listCollectionProperties()`
- `VaultClient.collectionProperties.addCollectionProperty()`
- `VaultClient.collectionProperties.getCollectionProperty()`
- `VaultClient.collectionProperties.updateCollectionProperty()`
- `VaultClient.collectionProperties.deleteCollectionProperty()`

### `VaultClient.bundles`

This <strong>beta</strong> Piiano Vault resource enables you to create, retrieve, list, update, and delete bundles that export functions used by custom data types.

- `VaultClient.bundles.listBundles()`
- `VaultClient.bundles.addBundle()`
- `VaultClient.bundles.getBundle()`
- `VaultClient.bundles.updateBundle()`
- `VaultClient.bundles.deleteBundle()`

### `VaultClient.dataTypes`

This <strong>beta</strong> Piiano Vault resource enables you to create, retrieve, list, and delete data types that can be used as property types.

- `VaultClient.dataTypes.listDataTypes()`
- `VaultClient.dataTypes.addDataType()`
- `VaultClient.dataTypes.getDataType()`
- `VaultClient.dataTypes.deleteDataType()`

### `VaultClient.objects`

This Piiano Vault resource enables you to create, retrieve, search, update, and delete collection objects and their data.

- `VaultClient.objects.listObjects()`
- `VaultClient.objects.addObject()`
- `VaultClient.objects.getObjectById()`
- `VaultClient.objects.updateObjectById()`
- `VaultClient.objects.deleteObjectById()`
- `VaultClient.objects.addObjects()`
- `VaultClient.objects.updateObjects()`
- `VaultClient.objects.deleteObjects()`
- `VaultClient.objects.searchObjects()`

### `VaultClient.crypto`

This <strong>beta</strong> Piiano Vault resource enables you to encrypt, decrypt, and update encrypted blobs.

- `VaultClient.crypto.encrypt()`
- `VaultClient.crypto.updateEncrypted()`
- `VaultClient.crypto.decrypt()`
- `VaultClient.crypto.hashObjects()`

### `VaultClient.tokens`

This Piiano Vault resource enables you to tokenize, detokenize, update, rotate, search, and delete tokens.

- `VaultClient.tokens.tokenize()`
- `VaultClient.tokens.detokenize()`
- `VaultClient.tokens.deleteTokens()`
- `VaultClient.tokens.updateTokens()`
- `VaultClient.tokens.rotateTokens()`
- `VaultClient.tokens.searchTokens()`


### `VaultClient.iam`

This Piiano Vault resource enables you to set and retrieve the IAM configuration and regenerate user API keys.

- `VaultClient.iam.getIamConf()`
- `VaultClient.iam.setIamConf()`
- `VaultClient.iam.regenerateUserApiKey()`

### `VaultClient.configVars`

This Piiano Vault resource enables you to set and retrieve the dynamic configuration variables that control the behavior of your Vault.

- `VaultClient.configVars.clearAllConfVars()`
- `VaultClient.configVars.getConfVar()`
- `VaultClient.configVars.setConfVar()`

### `VaultClient.system`

This Piiano Vault resource enables you to retrieve details about the status of system components and the Vault version.

- `VaultClient.system.dataHealth()`
- `VaultClient.system.controlHealth()`
- `VaultClient.system.getClusterInfo()`
- `VaultClient.system.garbageCollection()`
- `VaultClient.system.triggerError()`
- `VaultClient.system.getConfiguration()`
- `VaultClient.system.getLicense()`
- `VaultClient.system.getVaultVersion()`
- `VaultClient.system.rotateKeys()`
- `VaultClient.system.getKms()`

## Additional Headers

You can add additional headers for any request by passing the `additionalHeaders` option in the request object of any method.
This can be useful for adding custom headers like [`X-Pvault-Request-ID`](https://docs.piiano.com/guides/monitor/about-system-logs#trace-id) for tracing requests or the [`X-Pvault-Delegation`](https://docs.piiano.com/guides/manage-users-and-policies/role-delegation) header.

For example:
```typescript
vaultClient.objects.addObject({
  collection: 'customers',
  reason: 'AppFunctionality',
  requestBody: {
    name: 'John Doe',
    email: 'johndoe@example.com',
  },
  additionalHeaders: {
    'X-Pvault-Request-ID': '1234567890', // Will be added to the request headers
  },
});
```

## License

This package is licensed under the MIT License.
See the [LICENSE](../../LICENSE) file for more information.
