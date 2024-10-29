// Declare global functions available in Vault's Bundles.
declare global {
  /**
   * Fetches a resource from the network.
   * The Vault fetch function implement a compatible subset of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
   *
   * API calls made with this function are subject to the same restrictions as other outbound network requests in Vault and must be allowed by the [`PVAULT_SERVICE_ALLOWED_PCI_HTTP_DESTINATIONS`](https://docs.piiano.com/guides/configure/environment-variables#PVAULT_SERVICE_ALLOWED_PCI_HTTP_DESTINATIONS) configuration.
   */
  function fetch(url: string, options?: {
    method?: string,
    body?: string,
    headers?: Record<string, string>
  }): Promise<{
    ok: boolean,
    status: number,
    json: () => Promise<unknown>
    text: () => Promise<string>
  }>;

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
  function _deref<P extends { [key:string]: string }>(params: P): { [K in keyof P]: unknown };

  interface console {
    log(...data: any[]): void;
  }
}

export type HTTPResult = {
  StatusCode: number;
  Body: string;
}
