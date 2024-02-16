import { VaultClient } from "@piiano/vault-client";

async function main() {
  const client = new VaultClient({
    vaultURL: "http://localhost:8123",
    apiKey: "pvaultauth",
  });

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

  var response = await client.objects.addObject({
    collection: "users",
    reason: "AppFunctionality",
    requestBody: {
      name: "John Doe",
      email: "john@doe.com",
      phone: "+1-123-4567890",
    },
  });
  console.log(response);
  // sample output: { id: '2e29fc54-3ba5-4a7e-9774-f928e824effe' }
  // to get back run: pvault object get -c users --id '2e29fc54-3ba5-4a7e-9774-f928e824effe' -a
}

main();
