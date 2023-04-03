# TypeORM encryption example

This example application demonstrates how a simple express app with TypeORM can use the [@piiano/typeorm-encryption](https://www.npmjs.com/package/@piiano/typeorm-encryption)   package to automatically encrypt and decrypt Personally Identifiable Information (PII) in your database.

## Running the example

To run the example app, please follow these steps:

1. Clone the repository
2. Set the `PVAULT_SERVICE_LICENSE` environment variable to a valid Piiano Vault license key. You can obtain a free trial license key [here](https://piiano.com/docs/getting-started/).
3. Run `run-vault.sh`. This will download and launch a local instance of the Piiano Vault server using Docker and will start the example app.

After completing the above steps, you can interact with the example app's API to create and retrieve users.

## See it in action

To create a user, run the following command:

```bash
curl --request POST \
  --url http://localhost:3000/users \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "john",
    "email": "john@exmaple.com",
    "phone": "123-11111",
    "ssn": "123-11-1111",
    "dob": "1990-01-01",
    "state": "CA" 
  }'
```

The output should be:

```json
{
  "id": 1,
  "name": "john",
  "email": "john@exmaple.com",
  "phone": "123-11111",
  "ssn": "123-11-1111",
  "state": "CA"
}
```

To list all users, run the following command:

```bash
curl --request GET \
  --url http://localhost:3000/users
```

The output should be:

```json
[
  {
    "id": 1,
    "name": "john",
    "email": "john@exmaple.com",
    "phone": "123-11111",
    "ssn": "123-11-1111",
    "state": "CA"
  }
]
```

You can also query the database directly to see the encrypted data:

```bash
sqlite3 app.db -readonly 'SELECT * FROM user;'
```

## How it works

This example app utilizes a simple express app with TypeORM to store and retrieve data from a database.

To encrypt and decrypt data, the `@piiano/typeorm-encryption` package is used.

The package is configured to work with the Piiano Vault server to encrypt and decrypt fields annotated with `@Column({ encrypted: true })`.

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
