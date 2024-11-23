// Declare global functions available in Vault's Bundles.
declare global {
  /**
   * Fetches a resource from the network.
   * The Vault fetch function implement a compatible subset of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
   *
   * API calls made with this function are subject to the same restrictions as other outbound network requests in Vault and must be allowed by the [`PVAULT_SERVICE_ALLOWED_PCI_HTTP_DESTINATIONS`](https://docs.piiano.com/guides/configure/environment-variables#PVAULT_SERVICE_ALLOWED_PCI_HTTP_DESTINATIONS) configuration.
   */
  function fetch(
    url: string,
    options?: {
      method?: string;
      body?: string;
      headers?: Record<string, string>;
    },
  ): Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
    text: () => Promise<string>;
  }>;

  interface console {
    log(...data: any[]): void;
  }
}

export type HTTPResult = {
  StatusCode: number;
  Body: string;
};
