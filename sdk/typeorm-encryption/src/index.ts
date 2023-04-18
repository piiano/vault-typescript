import "./types";
import {VaultClient, VaultClientOptions as Options} from "@piiano/vault-client";
import {DataSource} from "typeorm";
import {Encryptor} from "./encryptor";
import {saveFunc} from "./save";
import {updateFunc} from "./update";
import {insertFunc} from "./insert";
import {patchQueryBuilder} from "./query-builder";
import {extendEntityMetadataBuilder} from "./entity-metadata-builder";

export * from "./types";


export default function registerVaultEncryption(dataSource: DataSource, options?: Options): DataSource {

  extendEntityMetadataBuilder();

  const encryptor = new Encryptor(dataSource, new VaultClient(options));

  dataSource.manager.save = saveFunc(dataSource.manager, encryptor);
  dataSource.manager.update = updateFunc(dataSource.manager, encryptor);
  dataSource.manager.insert = insertFunc(dataSource.manager, encryptor);


  patchQueryBuilder(dataSource, encryptor)

  return dataSource;
}

export {
  Options,
  registerVaultEncryption,
}
