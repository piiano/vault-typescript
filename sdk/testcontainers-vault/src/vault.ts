import { GenericContainer, Wait, StartedTestContainer, ExecResult } from "testcontainers";
import { VaultOptions } from "./options";

const vaultPort = 8123;

/**
 * A local Vault instance.
 */
export class Vault {
  private readonly container: GenericContainer;
  private startedContainer?: StartedTestContainer;

  constructor(public readonly options: VaultOptions = {}) {
    const {
      version = 'latest',
      env = {},
      license = process.env.PVAULT_SERVICE_LICENSE,
      port,
      reuse = false,
      withDB = true,
      bindMounts = []
    } = this.options;

    const vaultImage = withDB ? 'piiano/pvault-dev' : 'piiano/pvault-server'

    if (!license) {
      throw new Error('Missing Vault license');
    }

    const vars = Object.entries(env).reduce((acc: Record<string, string>, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, { PVAULT_SERVICE_LICENSE: license });

    this.container = new GenericContainer(`${vaultImage}:${version}`)
      .withExposedPorts(port ? { container: vaultPort, host: port } : vaultPort)
      .withEnvironment(vars)
      .withBindMounts(bindMounts)
      // A wait strategy that waits for Vault to be ready.
      .withWaitStrategy(Wait.forAll(['data', 'ctl'].map(service =>
        Wait
          .forHttp(`/api/pvlt/1.0/${service}/info/health`, vaultPort)
          .forStatusCode(200)
          .forResponsePredicate((res): boolean => {
            const json = JSON.parse(res);
            return json && typeof json === 'object' && 'status' in json && json?.status === 'pass';
          })
      )));

    if (reuse) {
      this.container = this.container.withReuse();
    }
  }

  /**
   * Starts the Vault container.
   */
  async start(): Promise<number> {
    if (!this.startedContainer) {
      this.startedContainer = await this.container.start();
    }
    return this.startedContainer.getMappedPort(vaultPort);
  }

  /**
   * Stops the Vault container.
   */
  async stop() {
    await this.startedContainer?.stop();
    this.startedContainer = undefined;
  }

  /**
   * Executes a command in the Vault container.
   */
  exec(command: string, ...args: string[]): Promise<ExecResult> {
    if (!this.startedContainer) {
      throw new Error('Vault container not started');
    }

    return this.startedContainer.exec([command, ...args]);
  }
}
