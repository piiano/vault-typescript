
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


  /**
   * The volumes to mount in the Vault container.
   */
  bindMounts: BindMount[];
  /**
    * Start Vault with a builtin database (default: true).
    */
  withDB?: boolean
  /**
    * Whether to reuse the container if it already exists (default: false).
    * If true, the container won't be stopped after the tests.
    */
  reuse?: boolean
}>

/**
 * A bind mount mode.
 */
export type BindMode = "rw" | "ro" | "z" | "Z";

/**
 * A bind mount.
 */
export type BindMount = {
  source: string;
  target: string;
  mode?: BindMode;
};
