import { VaultClient } from "@piiano/vault-client";

// by default VaultClient will connect to localhost with default credentials
const client = new VaultClient();

await client.collections.addCollection({
  requestBody: {
    name: "users",
    type: "PERSONS",
    properties: [
      { name: "email", data_type_name: "EMAIL", is_substring_index: true },
      { name: "ssn", data_type_name: "SSN", is_index: true },
    ],
  },
});

const response = await client.objects.addObjects({
  collection: "users",
  requestBody: [
    {
      id: "B1E90723-358F-4252-93C5-ABCAB12AC38C",
      email: "john.doe@acme.com",
      ssn: "123-45-6789",
    },
    {
      id: "86FEC284-DC17-4023-B4DE-E306E0157AE5",
      email: "jane.smith@acme.com",
      ssn: "987-65-4321",
    },
  ],
});

let queryResponse;
for (let i = 0; i < 10; i++) {
  try {
    queryResponse = await client.objects.searchObjects({
      collection: "users",
      props: ["id", "ssn"],
      requestBody: {
        like: {
          email: "john*",
        },
      },
    });

    if (queryResponse && queryResponse.results.length > 0) {
      break;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("PV3274")) {
      console.log("Index not ready yet, retrying in 1 second");
    } else {
      throw error;
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.log(queryResponse);
