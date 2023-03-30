import { VaultClient as OpenAPIVaultClient } from "./generated";
import {VaultClientOptions} from "./options";

export class VaultClient extends OpenAPIVaultClient {

  constructor(options?: VaultClientOptions) {
    super({
      BASE: options?.vaultURL ?? "http://localhost:8123",
      TOKEN: options?.apiKey ?? "pvaultauth",
    })
  }
}
