
import {EntitySubscriberInterface, EventSubscriber, getMetadataArgsStorage, InsertEvent, LoadEvent} from 'typeorm';
import {ColumnMetadataArgs} from "typeorm/metadata-args/ColumnMetadataArgs";
import {VaultClient, type VaultClientOptions} from "@piiano/vault-client";
import {ColumnMetadata} from "typeorm/metadata/ColumnMetadata";

export function CreateEncryptionSubscriber(options?: VaultClientOptions): new () => EntitySubscriberInterface {
  @EventSubscriber()
  class VaultEncryptionSubscriber extends EncryptionSubscriber implements EntitySubscriberInterface {
    constructor() {
      super(new VaultClient(options));
    }
  }

  return VaultEncryptionSubscriber;
}

class EncryptionSubscriber implements EntitySubscriberInterface {

  private readonly metadata = getMetadataArgsStorage();

  private readonly entityEncryptedPropsMap = new Map<new () => any, Array<{ propertyName: string, columnName: string }>>;

  constructor(private readonly vaultClient: VaultClient) {}

  getEntityEncryptedProps(entity: any, ownColumns: ColumnMetadata[]): Array<{ propertyName: string, columnName: string }> {
    const cachedEntityEncryptedProps = this.entityEncryptedPropsMap.get(entity.constructor);
    if (cachedEntityEncryptedProps) {
      return cachedEntityEncryptedProps;
    }

    const ownColumnsPropertyNames = new Set(ownColumns.map(col => col.propertyName));
    const entityEncryptedProps = this.metadata.columns
      .filter((columnMetadata) => (
        columnMetadata.target === entity.constructor &&
        columnMetadata.options?.encrypt &&
        columnMetadata.mode === "regular" &&
        ownColumnsPropertyNames.has(columnMetadata.propertyName)
      )).map(({propertyName, options}) => ({
        propertyName,
        columnName: options.name || propertyName,
      }));

    this.entityEncryptedPropsMap.set(entity.constructor, entityEncryptedProps);

    return entityEncryptedProps;
  }


  async beforeInsert(event: InsertEvent<any>): Promise<any> {
    const entityEncryptedProps = this.getEntityEncryptedProps(event.entity, event.metadata.ownColumns);

    const encryptedProps = await this.vaultClient.crypto.encrypt({
      requestBody: entityEncryptedProps.map(propToEncrypt => ({
        object: {
          fields: {
            [propToEncrypt.columnName]:
              event.entity[propToEncrypt.propertyName].constructor == Date ?
                event.entity[propToEncrypt.propertyName].toISOString() :
                event.entity[propToEncrypt.propertyName]
          }
        },
        props: [propToEncrypt.columnName],
      })),
      reason: 'AppFunctionality',
      collection: 'customers',
    });

    encryptedProps.forEach((encryptedProp, index) => {
      const {propertyName} = entityEncryptedProps[index];
      event.entity[propertyName] = encryptedProp.ciphertext;
    });
  }


  async afterLoad(entity: any, event?: LoadEvent<any>): Promise<any> {
    const entityEncryptedProps = this.getEntityEncryptedProps(entity, event!.metadata.ownColumns);

    const decryptedProps = await this.vaultClient.crypto.decrypt({
      requestBody: entityEncryptedProps.map(propToDecrypt => ({
        encrypted_object: {
          ciphertext: entity[propToDecrypt.propertyName],
        },
        props: [propToDecrypt.columnName],
      })),
      reason: 'AppFunctionality',
      collection: 'customers',
    });

    decryptedProps.forEach((decryptedProp, index) => {
      const {propertyName, columnName} = entityEncryptedProps[index];
      entity[propertyName] = decryptedProp.fields[columnName];
    });
  }

  afterInsert(event: InsertEvent<any>) {
    // console.log(event);
  }
}

async function walkEntityVaultProps<T>(
  columnMetadataArgs: ColumnMetadataArgs[],
  entity: T,
  cb: (entity: any, propertyName: string) => Promise<void>
) {
  for (const prop in entity) {


    if (isObject(entity[prop])) {
      await walkEntityVaultProps(columnMetadataArgs, entity[prop], cb);
    }



    for (let columnMetadata of columnMetadataArgs) {
      let { propertyName, mode, target } = columnMetadata;
      let options = columnMetadata.options;
      if (
        prop == propertyName &&
        options?.encrypt &&
        mode === "regular" &&
        entity?.constructor === target
      ) {
        await cb(entity, propertyName);
      }
    }
  }
}

function isObject(input: any): boolean {
  return typeof input === "object" && input !== null;
}
