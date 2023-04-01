import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { Customer } from "./entity/Customer";
import {EncryptionSubscriber} from "../src";

export const AppDataSource = new DataSource({
  type: "sqlite",
  synchronize: true,
  logging: false,
  database: "app.db",
  entities: [Customer],
  subscribers: [EncryptionSubscriber],
} as DataSourceOptions);

export const TestDataSource = new DataSource({
  ...AppDataSource.options,
  ...{ database: "test.db" },
} as DataSourceOptions);
