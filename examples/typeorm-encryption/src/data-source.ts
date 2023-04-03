import "reflect-metadata";
import {DataSource} from "typeorm";
import {User} from "./entity/User";
import registerVaultEncryption from "@piiano/typeorm-encryption";
import {Config} from "./config";
import {DataSourceOptions} from "typeorm/data-source/DataSourceOptions";


export default function initDataSource({ vaultURL, vaultAPIKey, port, ...dbOptions }: Config): Promise<DataSource> {
  return registerVaultEncryption(new DataSource({
    type: "sqlite",
    synchronize: true,
    logging: false,
    entities: [User],
    database: "app.db",
    ...dbOptions,
  } as DataSourceOptions), {
    vaultURL,
    apiKey: vaultAPIKey,
  }).initialize();
}
