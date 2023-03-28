/**
 * Options for configuring a local Vault instance.
 */
export type VaultOptions = Partial<{
  /**
   * The version of the Vault image to use.
   */
  version: string;

  /**
   * The port to expose on the host.
   * If not specified, a random port will be used.
   */
  port: number;


  /**
   * The Vault license to use.
   * If not specified, try to use the license from the PVAULT_SERVICE_LICENSE environment variable.
   */
  license: string;

  /**
   * The environment variables to pass to the Vault container.
   */
  env: Record<string, string | number | boolean>;
}>