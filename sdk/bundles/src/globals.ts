// Declare global functions available in Vault's Bundles.
declare global {
  function _httpGet(url: string): HTTPResult;

  function _httpPost(url: string, contentType: string, body: string): HTTPResult;

  interface console {
    log(...data: any[]): void;
  }
}

export type HTTPResult = {
  StatusCode: number;
  Body: string;
}
