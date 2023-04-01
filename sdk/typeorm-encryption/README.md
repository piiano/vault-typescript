# @piiano/typeorm-encryption

This package extends the `typeorm` package to provide support for encrypting and decrypting entity properties using a Piiano Vault server.

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

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details