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

### Querying encrypted properties

Querying on encrypted properties is handled automatically when identifying encrypted properties in a `where` clause without the need to decrypt the data first.

The encryption algorithm used by the Piiano Vault server is **deterministic**, meaning that the same value will always be encrypted to the same ciphertext in the database which makes querying possible.

> **Note**
> 
> Using this approach, limits the ability to query on encrypted properties to the `=` and `!=` operators.
> Other operators such as `>`, `<`, `>=`, `<=`, `LIKE`, `BETWEEN`, etc. are not supported.

For example, the following query will work as expected on the encrypted `email` property:

```javascript
const customers = await Customer.find({
  where: {
    email: 'shawnkemp@example.com',
  }
});
```

### Using Vault transformations

The Piiano Vault server supports the use of [transformations](https://piiano.com/docs/data-security/transformations/).

Transformations provide a mechanism to present sensitive data in a way that reduces data exposure.

For example, the `email` property in the example above could be masked using the `mask` transformation to return `s********@example.com` instead of the actual email address.

To use a transformation, append the transformation name to the column name in the `select` clause:

Vault transformation is performed on the Vault server and the result is returned to the client meaning the sensitive data never leaves the Vault server but only the transformed result. 

```javascript
import {withTransformations} from '@piiano/typeorm-encryption';

const customers = await withTransformations(Customer).find({
  select: { 'email.mask': true },
});

// returns:
// [
//   { 'email.mask': 's********@example.com' },
// ]
```

> **Note**
> The `withTransformations` function is a wrapper that extends the type of the given entity class to allow selecting on the transformation properties.
> It is not required to use the `withTransformations` function but it is recommended to allow proper type checking.

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
- Querying using the array notation don't of the same property in a transformed and untransformed form will return only the transformed value.
  Examples:
  Using select: `['email', 'email.mask']` will result in only `email.mask` being returned.
  While using select: `{'email.mask': true, 'email': true}` will result in both `email` and `email.mask` being returned.
  Selecting using the array notation is deprecated by TypeORM and is not recommended. 

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
