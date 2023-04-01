/// <reference types="typeorm" />

// import { ColumnCommonOptions as CCO } from "../node_modules/typeorm/decorator/options/ColumnCommonOptions"

import {VaultClientOptions as Options} from "@piiano/vault-client";
import {CreateEncryptionSubscriber} from "./subscribers";
import {DataSource} from "typeorm";

declare module "typeorm/decorator/options/ColumnCommonOptions" {
  interface ColumnCommonOptions {
    encrypt?: boolean;
  }
}


export default function registerVaultEncryption(dataSource: DataSource, options?: Options): DataSource {
  const EncryptionSubscriber = CreateEncryptionSubscriber(options);

  if (Array.isArray(dataSource.options.subscribers)) {
    dataSource.setOptions({
      subscribers: [EncryptionSubscriber, ...dataSource.options.subscribers],
    })
  } else {
    dataSource.setOptions({
      subscribers: {EncryptionSubscriber, ...dataSource.options.subscribers},
    })
  }

  return dataSource;
}

export {
  Options,
  registerVaultEncryption,
}