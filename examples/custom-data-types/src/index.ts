import type {VaultFunction} from "@piiano/vault-bundles";

/*
 * Vaults prior to 1.10.4 had a stricter SSN validation.
 * In this example we provided a new data type that has relaxed SSN validation that can work with earlier vaults.
 */

// Validators

export const validate: VaultFunction = {
  type: "validator",
  description: "Validates the SSN allowing input with spaces, dashes or compact format",
  handler(value) {
    return /^[0-9]([0-9]{2}[ -]?){2}[0-9]{4}$/.test(String(value));
  }
};

// Normalizers

export const normalize: VaultFunction = {
  type: "normalizer",
  description: "Normalizes the SSN to be stored in the database in the dash format",
  handler(value) {
    const compact = String(value).replace(/[ -]/g, "");
    const part1 = compact.slice(0, 3);
    const part2 = compact.slice(3, 5);
    const part3 = compact.slice(5);
    return part1 + "-" + part2 + "-" + part3;
  }
}

// Transformers

export const mask: VaultFunction = {
  type: "transformer",
  description: "Returns the masked SSN in the form of ***-**-4357",
  handler(context, object, value) {
    return String(value).replace(/^[0-9]{3}-?[0-9]{2}-?([0-9]{4})$/, "***-**-$1");
  }
}

export const compact: VaultFunction = {
  type: "transformer",
  description: "Returns the compact SSN without any spaces or dashes",
  handler(context, object, value) {
    return String(value).replace(/-/g, "");
  }
}

export const with_spaces: VaultFunction = {
  type: "transformer",
  description: "Returns the SSN with spaces between the parts",
  handler(context, object, value) {
    return String(value).replace(/-/g, " ");
  }
}
