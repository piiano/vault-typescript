import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
  type: "sqlite",
  synchronize: true,
  logging: false,
  database: "app.db",
  entities: [User],
} as DataSourceOptions);

export const TestDataSource = new DataSource({
  ...AppDataSource.options,
  ...{ database: "test.db" },
} as DataSourceOptions);
