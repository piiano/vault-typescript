/// <reference types="typeorm" />

// import { ColumnCommonOptions as CCO } from "../node_modules/typeorm/decorator/options/ColumnCommonOptions"

declare module "typeorm/decorator/options/ColumnCommonOptions" {
  interface ColumnCommonOptions {
    encrypt?: boolean;
  }
}

export * from "./subscribers";
