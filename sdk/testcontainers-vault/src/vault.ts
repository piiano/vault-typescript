import {GenericContainer, Wait} from "testcontainers";
import {VaultOptions} from "./options";
import {StartedTestContainer} from "testcontainers/dist/src/test-container";
import {Container} from "dockerode";
import {BoundPorts} from "testcontainers/dist/src/bound-ports";
import {AbstractWaitStrategy} from "testcontainers/dist/src/wait-strategy/wait-strategy";

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
      port
    } = this.options;

    if (!license) {
      throw new Error('Missing Vault license');
    }

    const vars = Object.entries(env).reduce((acc: Record<string, string>, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {PVAULT_SERVICE_LICENSE: license});

    this.container = new GenericContainer(`piiano/pvault-dev:${version}`)
      .withExposedPorts(port ? {container: vaultPort, host: port} : vaultPort)
      .withEnvironment(vars)
      .withWaitStrategy(new VaultWaitStrategy());
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
}

/**
 * A wait strategy that waits for Vault to be ready.
 */
class VaultWaitStrategy extends AbstractWaitStrategy {
  async waitUntilReady(container: Container, host: string, boundPorts: BoundPorts): Promise<void> {
    await Promise.all(['data', 'ctl'].map(async (service) =>
      Wait
        .forHttp(`/api/pvlt/1.0/${service}/info/health`, vaultPort)
        .forStatusCode(200)
        .forResponsePredicate((res): boolean => {
          const json = JSON.parse(res);
          return json && typeof json === 'object' && 'status' in json && json?.status === 'pass';
        })
        .withStartupTimeout(this.startupTimeout)
        .waitUntilReady(container, host, boundPorts)
    ));
  }
}
