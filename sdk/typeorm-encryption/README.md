<p>
  <a href="https://piiano.com/pii-data-privacy-vault/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://piiano.com/docs/img/logo-developers-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://piiano.com/wp-content/uploads/piiano-logo-developers.png">
      <img alt="Piiano Vault" src="https://piiano.com/wp-content/uploads/piiano-logo-developers.png" height="40" />
    </picture>
  </a>
</p>

# @piiano/typeorm-encryption

This package extends the `typeorm` package to provide support for encrypting and decrypting entity properties using a Piiano Vault server.

## Requirements

- `typeorm` version 0.3.12 or higher.
- Vault server version 1.3.1 or higher. If this is your first time using Vault, you can [get started here](https://piiano.com/docs/guides/get-started).

## Installation

To install the package using `npm`:

```bash
npm install @piiano/typeorm-encryption
```

To install the package using `yarn`:

```bash
yarn add @piiano/typeorm-encryption
```

## Usage

To register the automatic encryption and decryption of entity properties, first import the `registerVaultEncryption` function into your project:

```typescript
import registerVaultEncryption from '@piiano/typeorm-encryption';
```

Then call the `registerVaultEncryption` function with the `DataSource` object:

```typescript
import {DataSource} from "typeorm";
import registerVaultEncryption from '@piiano/typeorm-encryption';

async function main() {
  const dataSource = new DataSource({
    type: "sqlite",
    synchronize: true,
    logging: false,
    database: "app.db",
    entities: [Customer],
  });

  registerVaultEncryption(dataSource, {
    vaultURL: 'https://vault.example.com:8123',
    apiKey: 'vaultApiKey',
  });

  await dataSource.initialize();
}
```

> **Note:** The `registerVaultEncryption` function must be called before call to `DataSource.initialize()`.

If not declared `registerVaultEncryption` options default to:

```javascript
const defaultOptions = {
  vaultURL: "http://localhost:8123",
  apiKey: "pvaultauth",
}
```

### Entity

To encrypt and decrypt entity properties, the `encrypt: true` column option must be set:

```typescript
@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({encrypt: true})
  name: string;

  @Column({encrypt: true})
  email: string;

  @Column({encrypt: true})
  phone: string;

  @Column({encrypt: true})
  ssn: string;
  
  @Column()
  state: string;
}
```

In the example above, the `name`, `email`, `phone`, and `ssn` properties will be encrypted and decrypted automatically.

## Development

To build and test the project:
```commandLine
yarn
yarn build
yarn test
```

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details

## Known Limitations

- Encryption is supported only for string columns.
- Search queries are not supported on encrypted columns. Support for search queries is planned for a future release.

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

More details can be found [on our website](https://piiano.com/pii-data-privacy-vault/) and on the [developers portal](https://piiano.com/docs/).
