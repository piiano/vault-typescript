/**
 * The input for the decrypt method.
 */
export type DecryptInput = {
  /**
   * The collection to use for decryption.
   */
  collection: string;
  /**
   * The request body containing the encrypted objects and the properties to decrypt.
   */
  requestBody: DecryptionRequest[];
  /**
   * The options to use for decryption.
   */
  options?: ("archived" | "include_metadata")[];
};

export type DecryptionRequest = {
  /**
   * The encrypted object to decrypt.
   */
  encryptedObject: {
    ciphertext: string;
    scope?: string;
  };
  /**
   * The properties to return from the decrypted object.
   */
  props: string[];
};

export type DecryptOutputObject = {
  /**
   * The decrypted object.
   */
  fields: { [key: string]: unknown };
  /**
   * The metadata of the decrypted object available only if the "include_metadata" option is used.
   */
  metadata?: {
    expiration: string;
    scope: string;
    tags: string[];
    type: "randomized" | "deterministic";
  };
};

/**
 * Vault exposes methods to be used with Vault API from the action.
 * The vault object exposes a subset of the Vault JS SDK.
 */
export type Vault = {
  /**
   * Dereference received a key-value object with each string value being a [vault global identifier](https://docs.piiano.com/guides/reference/http-call-request#vault-global-identifier).
   * It evaluates the global identifier and returns a new object with the same keys and the evaluated values of the global identifiers.
   *
   * For example:
   * ```typescript
   * const { maskedNumber, customer } = _deref({
   *   maskedNumber: 'pvlt:detoeknize:credit_cards:number.mask:bb5e17ce-38b1-4b3f-9b4b-40801f9672d1:',
   *   customer: 'pvlt:read_object:customers::bb5e17ce-38b1-4b3f-9b4b-40801f9672d1:',
   * });
   *
   * console.log(maskedNumber); // '************1234'
   * console.log(customer); // { id: 'bb5e17ce-38b1-4b3f-9b4b-40801f9672d1', name: 'John Doe' }
   * ```
   */
  deref: <P extends { [key: string]: string }>(
    params: P,
  ) => Promise<{ [K in keyof P]: unknown }>;

  /**
   * The crypto object exposes methods to interact with [vault encryption APIs](https://docs.piiano.com/api/crypto).
   */
  crypto: {
    /**
     * Decrypt object ciphertext that was encrypted with vault using the [vault decrypt API](https://docs.piiano.com/api/operations/decrypt).
     */
    decrypt: (params: DecryptInput) => Promise<DecryptOutputObject[]>;
  };
};
