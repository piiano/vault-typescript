<p>
  <a href="https://piiano.com/pii-data-privacy-vault/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.piiano.com/img/logo-developers-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://docs.piiano.com/img/logo-developers.svg">
      <img alt="Piiano Vault" src="https://docs.piiano.com/img/logo-developers.svg" height="40" />
    </picture>
  </a>
</p>

# TypeORM encryption example

This example application demonstrates how a simple express app with TypeORM can use the [@piiano/typeorm-encryption](https://www.npmjs.com/package/@piiano/typeorm-encryption)   package to automatically encrypt and decrypt Personally Identifiable Information (PII) in your database.

## Running the example

To run the example app, please follow these steps:

1. Clone the repository and navigate to this directory.
   ```bash
   git clone https://github.com/piiano/vault-typescript.git
   cd vault-typescript/examples/typeorm-encryption
   ```
2. Set the `PVAULT_SERVICE_LICENSE` environment variable to a valid Piiano Vault license key.
   
   You can obtain a free trial license key [here](https://piiano.com/docs/getting-started/).
3. Run `run-vault.sh`.

   This will download and launch a local instance of the Piiano Vault dev server using Docker and will start the example app.

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
sqlite3 app.db -readonly -json 'SELECT * FROM user;'
```

The output should be similar to (the actual values will be different due to the encryption):

```json
[
  {
    "id": 1,
    "name": "AgAB8yJuC4StPSFytrH0hY0LoTrztPsdjPSP3BJMxNAfdvE/qjP7NMIc95UQet6aYfPimahHGdoSc3VuKcsUapHbpF/NOFNX44t+sJS+wZ09AjtpFpI02tR2PQ==",
    "email": "AgAB8yJuCwSPZJO6ZUs8uUsLQi+JNFAIsghsJ9bSole62fVyp3Ts3a4PsJfrrYU/nzYK/KerGOH+YiCzYyuPWK6P7Sw0GcdlsSuv1wQ3CHateGTwu7rJgl4dJt9BdkgZPhwXhJFvvAxE",
    "phone": "AgAB8yJuCw3Ti+oUTrLlDDsrAqzu1L7MuVTVgH3QN7OWvfr+lMPKcW58R3YHacDAUb/NBAXDn2A7v9uV41iQFEgdrQII5JOHzBEFVYLyxFTRwH9F3C8bjOjq448g75HgvpndxwIrmIQHT3jXHShx/Q==",
    "ssn": "AgAB8yJuC0Pgy4/54YId7N5G0bJB4juARu9lZ7MU+N0Fp8fKRQ7pgqw+MYpdZYTX1azXA1OXjyXalDvapTVxOSqNvBj0h7/0hMNrCh0fZAQQf62OvwXbgu9DuOLty744",
    "state": "CA"
  }
]
```

## How it works

This example app utilizes a simple express app with TypeORM to store and retrieve data from a database.

To encrypt and decrypt data, the `@piiano/typeorm-encryption` package is used.

The package is configured to work with the Piiano Vault server to encrypt and decrypt fields annotated with `@Column({ encrypted: true })`.

> **⚠️ Note:**
> 
> We used a local instance of the Piiano Vault dev server for this example.
> 
> This instance is not suitable for production use as it does not persist the encryption keys which means that the data will be lost when the server is restarted.
> 
> To read more about how to deploy Piiano Vault in production, please refer to the [Piiano Vault documentation](https://piiano.com/docs/).

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

## Issues and Feedback

If you encounter any issues or have feedback, please feel free to open an issue on this GitHub repository. We appreciate your contributions and suggestions for improvement!
