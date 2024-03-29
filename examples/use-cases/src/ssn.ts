import { VaultClient } from "@piiano/vault-client";

// by default VaultClient will connect to localhost with default credentials
const client = new VaultClient();

await client.collections.addCollection({
  requestBody: {
    name: "users",
    type: "PERSONS",
    properties: [
      { name: "name", data_type_name: "NAME" },
      { name: "ssn", data_type_name: "SSN" },
    ],
  },
});

const token = await client.tokens.tokenize({
  collection: "users",
  reason: "AppFunctionality",
  requestBody: [
    {
      object: { fields: { name: "john doe", ssn: "444-21-4357" } },
      type: "deterministic",
    },
  ],
});
console.log(token);
// sample output: [ { token_id: '1aca18c7-aaa2-3c59-5418-7546433be09c' } ]
// to get back run: pvault token detokenize -c users --token-id 1aca18c7-aaa2-3c59-5418-7546433be09c
