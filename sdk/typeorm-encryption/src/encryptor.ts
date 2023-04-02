import {DataSource, getMetadataArgsStorage, ObjectLiteral} from 'typeorm';
import {VaultClient} from "@piiano/vault-client";
import {DeepPartial} from "typeorm/common/DeepPartial";

type VaultFieldMetadata = {
  name: string;
  propertyName: string;
}

type VaultMetadata = {
  collection: string;
  fields: Array<VaultFieldMetadata>
}

export class Encryptor {

  private readonly metadata = getMetadataArgsStorage();
  private readonly entityVaultMetadataMap = new Map<Function | string, VaultMetadata>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly vaultClient: VaultClient) {
  }

  async encrypt<T extends DeepPartial<ObjectLiteral>>(target: Function | string, entity: T): Promise<T> {
    let {collection, fields} = this.getVaultMetadata(target);
    fields = fields.filter(field => entity[field.propertyName] !== undefined)

    const encryptedProps = await this.vaultClient.crypto.encrypt({
      requestBody: fields
        .map(field => ({
          object: {
            fields: {
              [field.name]: entity[field.propertyName],
            }
          },
          props: [field.name],
        })),
      reason: 'AppFunctionality',
      collection,
    });

    const clonedEntity = clone(entity);

    encryptedProps.forEach(({ciphertext}, index) => {
      const {propertyName} = fields[index];
      clonedEntity[propertyName] = ciphertext;
    });

    return clonedEntity;
  }


  async decrypt(target: Function | string, entity: DeepPartial<ObjectLiteral>): Promise<void> {
    const {collection, fields} = this.getVaultMetadata(target);

    const decryptedProps = await this.vaultClient.crypto.decrypt({
      requestBody: fields.map(field => ({
        encrypted_object: {
          ciphertext: entity[field.propertyName],
        },
      })),
      reason: 'AppFunctionality',
      collection,
    });

    decryptedProps.forEach((decryptedProp, index) => {
      const {propertyName, name} = fields[index];
      const value = decryptedProp.fields[name] || decryptedProp.fields[name.toLowerCase()]
      if (value === undefined || value === null) {
        return;
      }
      entity[propertyName] = value;
    });
  }

  getVaultMetadata<Entity extends ObjectLiteral>(target: Function | string): VaultMetadata {
    const entityVaultMetadata = this.entityVaultMetadataMap.get(target);
    if (entityVaultMetadata) {
      return entityVaultMetadata;
    }

    const entityMetadata = this.dataSource.getMetadata(target);

    const collection = entityMetadata.tableName;
    const fields = entityMetadata.inheritanceTree.map(this.getTargetEncryptedColumns.bind(this)).flat();

    const vaultMetadata = {collection, fields};

    this.entityVaultMetadataMap.set(target, vaultMetadata);

    return vaultMetadata;
  }

  getTargetEncryptedColumns<Entity extends ObjectLiteral>(target: Function | string): Array<VaultFieldMetadata> {
    return this.metadata.filterColumns(target)
      .filter((columnMetadata) => (
        columnMetadata.options?.encrypt &&
        columnMetadata.mode === "regular"
      )).map(({propertyName, options}) => ({
        propertyName,
        name: options.vaultField || options.name || propertyName,
      }));
  }
}

export function clone<T extends object>(obj: T): T {
  return Object.assign(Object.create(obj), obj);
}
