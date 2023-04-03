import {DataSourceOptions} from "typeorm/data-source/DataSourceOptions";

export type Config = Partial<DataSourceOptions> & {
  vaultURL: string;
  vaultAPIKey: string;
  port?: number;
}

export function getConfig(): Config {
  return {
    vaultURL: `http://${process.env.VAULT_HOST || 'localhost'}:${process.env.VAULT_PORT || 8123}`,
    vaultAPIKey: process.env.VAULT_API_KEY || "pvaultauth",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    database: "app.db",
    dropSchema: true,
  }
}