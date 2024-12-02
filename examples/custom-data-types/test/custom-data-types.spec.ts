import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import { Vault } from "@piiano/testcontainers-vault";
import { VaultClient } from "@piiano/vault-client";

const vault = new Vault({
  ...(process.env.VAULT_VERSION ? { version: process.env.VAULT_VERSION } : {}),
  env: {
    PVAULT_SENTRY_ENABLE: false,
    PVAULT_LOG_DATADOG_ENABLE: "none",
  },
});

let vaultClient: VaultClient;

describe("custom data types", function () {
  before(
    async () => {
      vaultClient = new VaultClient({
        vaultURL: `http://localhost:${await vault.start()}`,
      });
    },
    { timeout: 30000 },
  );

  after(() => vault.stop(), { timeout: 10000 });

  it("create custom bundle and custom data type and use it", async function () {
    const bundleCode = await readFile(resolve(__dirname, "../dist/index.js"));
    const bundle = await vaultClient.bundles.addBundle({
      requestBody: {
        name: "string_ssn",
        description: "Functions for custom SSN type",
        code: bundleCode.toString("base64"),
      },
    });

    assert.ok(bundle);
    assert.ok(bundle.exports?.validators);
    assert.equal(bundle.exports?.validators?.length, 1);
    assert.equal(bundle.exports?.validators?.[0]?.name, "validate");
    assert.equal(bundle.exports?.validators?.[0]?.type, "validator");

    assert.ok(bundle.exports?.normalizers);
    assert.equal(bundle.exports?.normalizers?.length, 1);
    assert.equal(bundle.exports?.normalizers?.[0]?.name, "normalize");
    assert.equal(bundle.exports?.normalizers?.[0]?.type, "normalizer");

    assert.ok(bundle.exports?.transformers);
    assert.equal(bundle.exports?.transformers?.length, 3);
    assert.deepEqual(
      bundle.exports?.transformers?.map(({ name, type }) => ({ name, type })),
      [
        { type: "transformer", name: "compact" },
        { type: "transformer", name: "mask" },
        { type: "transformer", name: "with_spaces" },
      ],
    );

    await vaultClient.customDataTypes.addDataType({
      requestBody: {
        name: "STRING_SSN",
        base_type_name: "STRING",
        description:
          "A custom SSN type with custom validations and transformations based on the built-in STRING type.",
        validator: "string_ssn.validate",
        normalizer: "string_ssn.normalize",
        transformers: [
          "string_ssn.mask",
          "string_ssn.compact",
          "string_ssn.with_spaces",
        ],
      },
    });

    await vaultClient.collections.addCollection({
      requestBody: {
        name: "ssns",
        type: "PERSONS",
        properties: [
          {
            name: "ssn",
            data_type_name: "STRING_SSN",
          },
        ],
      },
    });

    const { id } = await vaultClient.objects.addObject({
      collection: "ssns",
      reason: "AppFunctionality",
      requestBody: {
        ssn: "123456789",
      },
    });
    assert.ok(id);
    assert.equal(typeof id, "string");

    // Read SSN with and without transformations
    const result = await vaultClient.objects.getObjectById({
      collection: "ssns",
      reason: "AppFunctionality",
      id,
      props: ["ssn", "ssn.mask", "ssn.compact", "ssn.with_spaces"],
    });

    assert.deepEqual(result, {
      ssn: "123-45-6789",
      "ssn.compact": "123456789",
      "ssn.mask": "***-**-6789",
      "ssn.with_spaces": "123 45 6789",
    });
  });
});
