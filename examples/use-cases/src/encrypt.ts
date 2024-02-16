import { VaultClient } from "@piiano/vault-client";

async function main() {
  const client = new VaultClient({
    vaultURL: "http://localhost:8123",
    apiKey: "pvaultauth",
  });

  // a collection is needed for validation and scoping purposes even though it doesn't store data
  await client.collections.addCollection({
    requestBody: {
      name: "users",
      type: "PERSONS",
      properties: [
        { name: "name", data_type_name: "NAME" },
        { name: "email", data_type_name: "EMAIL" },
        { name: "phone", data_type_name: "PHONE_NUMBER" },
      ],
    },
  });

  var ciphertext = await client.crypto.encrypt({
    collection: "users",
    reason: "AppFunctionality",
    requestBody: [
      {
        type: "deterministic",
        object: {
          fields: {
            name: "John Doe",
            email: "john@doe.com",
            phone: "+1-123-4567890",
          },
        },
      },
    ],
  });
  console.log(ciphertext);
  // sample output: ciphertext: 'AgABTIAK9aewOWlCoYOy7......nfitJ7/jh' (output shortened for brevity)
  // to decrypt run: pvault crypto decrypt -c users --ciphertext 'AgABTIAK9aewOWlCoYOy7......nfitJ7/jh'
}

main();
