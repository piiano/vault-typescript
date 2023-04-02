/// <reference types="typeorm" />

import {VaultClient, VaultClientOptions as Options} from "@piiano/vault-client";
import {DataSource} from "typeorm";
import {Encryptor} from "./encryptor";
import {CreateDecryptionSubscriber} from "./subscribers";
import {saveFunc} from "./save";
import {updateFunc} from "./update";


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

  if (Array.isArray(dataSource.options.subscribers)) {
    dataSource.setOptions({
      subscribers: [DecryptionSubscriber, ...dataSource.options.subscribers],
    })
  } else {
    dataSource.setOptions({
      subscribers: {DecryptionSubscriber, ...dataSource.options.subscribers},
    })
  }

  return dataSource;
}

export {
  Options,
  registerVaultEncryption,
}
