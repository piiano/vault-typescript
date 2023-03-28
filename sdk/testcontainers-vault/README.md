# @piiano/testcontainers-vault

Testcontainers-vault helps you run a Piiano Vault container for testing purposes directly from your Typescript tests.

## Requirements

- Docker - This module uses [testcontainers](https://www.npmjs.com/package/testcontainers) under the hood, which requires Docker to be installed and running.
- A valid Vault license - follow the [Vault getting started](https://piiano.com/docs/guides/get-started/) to obtain a free 30 days license (no credit card required)

## Installation

### Install with yarn

```bash
yarn add -D @piiano/testcontainers-vault
```

### Install with npm

```bash
npm install --save-dev @piiano/testcontainers-vault
```

## Usage

```typescript
import { Vault } from '@piiano/testcontainers-vault';

const vault = new Vault();

const port = await vault.start();

// Do something with the container
// ...

await vault.stop();
```

Calling to `new Vault()` can also accept a `VaultOptions` object to configure the container.

The `VaultOptions` can be used to specify the version of the Vault image to use, the port to expose on the host, the Vault license to use, and the environment variables to pass to the Vault container.

```typescript 
/**
 * Options for configuring a local Vault instance.
 */
export type VaultOptions = Partial<{
  /**
   * The version of the Vault image to use.
   */
  version: string;

  /**
   * The port to expose on the host.
   * If not specified, a random port will be used.
   */
  port: number;


  /**
   * The Vault license to use.
   * If not specified, try to use the license from the PVAULT_SERVICE_LICENSE environment variable.
   */
  license: string;

  /**
   * The environment variables to pass to the Vault container.
   */
  env: Record<string, string | number | boolean>;
}>
```

## License

[MIT](./LICENSE)

## More information

- [Piiano Vault](https://piiano.com)
- [Piiano Vault Documentation](https://piiano.com/docs)