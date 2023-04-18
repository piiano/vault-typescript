import {DataSource, ObjectLiteral} from 'typeorm';
import {VaultClient} from "@piiano/vault-client";
import {DeepPartial} from "typeorm/common/DeepPartial";

export class Encryptor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly vaultClient: VaultClient) {
  }

  async encrypt<T extends DeepPartial<ObjectLiteral>>(target: Function | string, entity: T): Promise<T> {
    const {tableName, columns} = this.dataSource.getMetadata(target);
    const fields = columns.filter(column => entity[column.propertyName] !== undefined && column.isEncrypted);

    const encryptedProps = await this.vaultClient.crypto.encrypt({
      requestBody: fields
        .map(field => ({
          // use deterministic encryption to allow searching by encrypted value
          type: 'deterministic',
          props: [field.vaultFieldName],
          object: {
            fields: { [field.vaultFieldName]: entity[field.propertyName] }
          },
        })),
      reason: 'AppFunctionality',
      collection: tableName,
    });

    // clone entity to avoid mutating original object
    const clonedEntity = Object.assign(Object.create(entity), entity);

    encryptedProps.forEach(({ciphertext}, index) => {
      const {propertyName} = fields[index];
      clonedEntity[propertyName] = ciphertext;
    });

    return clonedEntity;
  }


  async decrypt(target: Function | string, transformations: { [key: string]: string[] }, ...entities: DeepPartial<ObjectLiteral>[]): Promise<void> {
    const {name, tableName, columns} = this.dataSource.getMetadata(target);

    const selectedEncryptedFields = columns.filter(column =>
      column.isEncrypted && (!transformations || (name + '.' + column.propertyName) in transformations));

    const decryptedProps = await this.vaultClient.crypto.decrypt({
      requestBody: entities.map(entity => selectedEncryptedFields.map(field => ({
        encrypted_object: {
          ciphertext: entity[field.propertyName],
        },
        ...(transformations ? { props: transformations[name + '.' + field.propertyName] } : {}),
      }))).flat(),
      reason: 'AppFunctionality',
      collection: tableName,
    });

    decryptedProps.forEach((decryptedProp, index) => {
      const entityIndex = Math.floor(index / selectedEncryptedFields.length);
      const selectedEncryptedIndex = index % selectedEncryptedFields.length;

      const entity = entities[entityIndex];
      const selectedEncryptedField = selectedEncryptedFields[selectedEncryptedIndex];

      delete entity[selectedEncryptedField.propertyName];

      for (const decryptedField in decryptedProp.fields) {
        const dotIndex = decryptedField.indexOf('.');
        entity[selectedEncryptedField.propertyName + (dotIndex === -1 ? '' : decryptedField.slice(dotIndex))] = decryptedProp.fields[decryptedField];
      }
    });
  }
}

