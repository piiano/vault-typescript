import { VaultClient } from "@piiano/vault-client";

const client = new VaultClient({
  vaultURL: "http://localhost:8123",
  apiKey: "pvaultauth",
});

var collections = await client.collections.listCollections({
  format: "json",
});

console.log(
  "Found these collections: ",
  collections.map((item) => item.name).join(", ")
);

for (const item of collections) {
  console.log("Removing ", item.name);
  await client.collections.deleteCollection({ collection: item.name });
}
