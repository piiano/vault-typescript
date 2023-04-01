
import {EntitySubscriberInterface, EventSubscriber, getMetadataArgsStorage, InsertEvent} from 'typeorm';
import {ColumnMetadataArgs} from "typeorm/metadata-args/ColumnMetadataArgs";

@EventSubscriber()
export class EncryptionSubscriber implements EntitySubscriberInterface {

  private readonly metadata = getMetadataArgsStorage();
  private readonly vaultClient = new VaultClient();

  beforeInsert(event: InsertEvent<any>): Promise<any> | void {

    const ownColumnsPropertyNames = new Set(event.metadata.ownColumns.map(col => col.propertyName));
    const propsToEncrypt = this.metadata.columns
      .filter((columnMetadata) => (
        columnMetadata.target === event.entity.constructor &&
        columnMetadata.options?.encrypt &&
        columnMetadata.mode === "regular" &&
        ownColumnsPropertyNames.has(columnMetadata.propertyName)
      )).map(({propertyName, options}) => ({
        propertyName,
        columnName: options.name || propertyName,
        value: event.entity[propertyName]
      }));

    console.log(propsToEncrypt)




    //
    // for (let columnMetadata of columnMetadataArgs) {
    //   let { propertyName, mode, target } = columnMetadata;
    //   let options = columnMetadata.options;
    //   if (
    //     prop == propertyName &&
    //     options?.encrypt &&
    //     mode === "regular" &&
    //     entity?.constructor === target
    //   ) {
    //     await cb(entity, propertyName);
    //   }
    // }

    // console.log(event.entity);
    // console.log(event.metadata.ownColumns);
    // console.log(event);
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
