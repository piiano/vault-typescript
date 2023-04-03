/// <reference types="typeorm" />

import {VaultClient, VaultClientOptions as Options} from "@piiano/vault-client";
import {DataSource, InstanceChecker, ObjectLiteral, QueryRunner, SelectQueryBuilder, TypeORMError} from "typeorm";
import {Encryptor} from "./encryptor";
import {CreateDecryptionSubscriber} from "./subscriber";
import {saveFunc} from "./save";
import {updateFunc} from "./update";

import "typeorm/decorator/options/ColumnCommonOptions"
import {insertFunc} from "./insert";
import {EntityTarget} from "typeorm/common/EntityTarget";
import {DriverUtils} from "typeorm/driver/DriverUtils";
import {inspect} from "util";

declare module "typeorm/decorator/options/ColumnCommonOptions" {
  interface ColumnCommonOptions {
    encrypt?: boolean;
    vaultField?: string;
  }
}


export default function registerVaultEncryption(dataSource: DataSource, options?: Options): DataSource {
  const encryptor = new Encryptor(dataSource, new VaultClient(options));
  const DecryptionSubscriber = CreateDecryptionSubscriber(encryptor);

  dataSource.manager.save = saveFunc(dataSource.manager, encryptor);
  dataSource.manager.update = updateFunc(dataSource.manager, encryptor);
  dataSource.manager.insert = insertFunc(dataSource.manager, encryptor);

  const createQueryBuilder = dataSource.createQueryBuilder.bind(dataSource);
  dataSource.createQueryBuilder = function (...args: any): any {
    const queryBuilder = createQueryBuilder(...args);

    // @ts-ignore
    const executeEntitiesAndRawResults = queryBuilder.executeEntitiesAndRawResults.bind(queryBuilder)

    // @ts-ignore
    queryBuilder.executeEntitiesAndRawResults = function (...args: any): any {
      //
      // const a = inspect(this.expressionMap, {depth: 10, colors: true, compact: true})
      // console.log(a);
      // console.log(a.includes('email.mask'));
      // @ts-ignore
      return executeEntitiesAndRawResults(...args);
    }
    return queryBuilder;
  }

  if (Array.isArray(dataSource.options.subscribers)) {
    dataSource.setOptions({
      subscribers: [DecryptionSubscriber, ...dataSource.options.subscribers],
    });
  } else {
    dataSource.setOptions({
      subscribers: {DecryptionSubscriber, ...dataSource.options.subscribers},
    });
  }

  return dataSource;
}

export {
  Options,
  registerVaultEncryption,
}
