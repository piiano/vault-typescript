import {
  DataSource,
  EntityMetadata,
  EntityPropertyNotFoundError,
  FindOptionsSelect,
  QueryRunner,
  SelectQueryBuilder
} from "typeorm";
import {Encryptor} from "./encryptor";
import {ObjectLiteral} from "typeorm/common/ObjectLiteral";

type QueryBuilderCreator = DataSource['createQueryBuilder'];


export function patchQueryBuilder<Entity extends ObjectLiteral>(dataSource: DataSource, encryptor: Encryptor) {
  const createQueryBuilder: QueryBuilderCreator = dataSource.createQueryBuilder.bind(dataSource);

  dataSource.createQueryBuilder = function (...args: any): any {
    const queryBuilder = createQueryBuilder(...args);

    // extend the query builder with our own methods
    queryBuilder.handleQueryEncryptedParameters = handleQueryEncryptedParameters<Entity>;

    // override the buildSelect method to allow selecting encrypted columns with transformations
    // @ts-ignore - ignore type checking because we are overriding a protected method
    queryBuilder.buildSelect = buildSelect<Entity>;

    // @ts-ignore - ignore type checking because we are accessing a protected method
    const internalExecuteEntitiesAndRawResults = queryBuilder.executeEntitiesAndRawResults.bind(queryBuilder)
    // @ts-ignore - ignore type checking because we are overriding a protected method
    queryBuilder.executeEntitiesAndRawResults = patchExecuteEntitiesAndRawResults(internalExecuteEntitiesAndRawResults, encryptor);

    return queryBuilder;
  };
}

function buildSelect<Entity extends ObjectLiteral>(this: SelectQueryBuilder<Entity>,
                     select: FindOptionsSelect<Entity>,
                     metadata: EntityMetadata,
                     alias: string,
                     embedPrefix?: string,
) {
  for (let key in select) {
    if (select[key] === undefined || select[key] === false) continue

    const propertyPath = embedPrefix ? embedPrefix + "." + key : key
    const column = metadata.findColumnWithPropertyPathStrict(propertyPath);
    const embed = metadata.findEmbeddedWithPropertyPath(propertyPath);
    const relation = metadata.findRelationWithPropertyPath(propertyPath);
    const encryptedColumn = metadata.findEncryptedColumnWithPropertyPath(propertyPath);

    if (!embed && !column && !relation && !encryptedColumn)
      throw new EntityPropertyNotFoundError(propertyPath, metadata)

    if (encryptedColumn) {
      if (!this.transformations) {
        this.transformations = {};
      }

      if (!this.transformations[alias + "." + encryptedColumn.propertyPath]) {
        this.transformations[alias + "." + encryptedColumn.propertyPath] = [];
      }

      this.transformations[alias + "." + encryptedColumn.propertyPath].push(encryptedColumn.transformation);

      this.selects.push(alias + "." + encryptedColumn.propertyPath)
    } else if (column) {
      this.selects.push(alias + "." + propertyPath)
    } else if (embed) {
      this.buildSelect(
        select[key] as FindOptionsSelect<any>,
        metadata,
        alias,
        propertyPath,
      )
    }
  }
}


function patchExecuteEntitiesAndRawResults<Entity extends ObjectLiteral>(internalExecuteEntitiesAndRawResults: SelectQueryBuilder<Entity>['executeEntitiesAndRawResults'], encryptor: Encryptor): SelectQueryBuilder<Entity>['executeEntitiesAndRawResults'] {
  return async function executeEntitiesAndRawResults(this: SelectQueryBuilder<Entity>, queryRunner: QueryRunner):
    Promise<{ entities: any[]; raw: any[] }> {
    // allow querying on encrypted columns by encrypting any encrypted parameters in the query conditions and matching them by ciphertext.
    await this.handleQueryEncryptedParameters(encryptor);

    // run original method to get the results
    const result = await internalExecuteEntitiesAndRawResults(queryRunner);

    if (result.entities.length === 0) return result;
    const target = result.entities[0].constructor;

    // decrypt any encrypted properties in the results and return them - this method will mutate the entities in the result.
    await encryptor.decrypt(target, this.transformations, ...result.entities);

    return result;
  }
}

async function handleQueryEncryptedParameters<Entity extends ObjectLiteral>(this: SelectQueryBuilder<Entity>, encryptor: Encryptor) {
  const matchConditionRegex = /(?<alias>\w+)\.(?<propertyName>\w+) !?= :(?<parameterName>orm_param_[0-9]+)/gm;
  const matches = this.conditions.matchAll(matchConditionRegex);
  for (const {groups} of matches) {
    const {alias, propertyName, parameterName} = groups!;

    const entity = this.expressionMap.aliases.find(({name}) => name === alias);

    if (!entity || !this.expressionMap.parameters[parameterName]) continue;

    const column = entity?.metadata.findColumnWithPropertyPathStrict(propertyName);

    if (!column || !column.isEncrypted) continue;

    // TODO: consider using bulk encryption. Requires grouping by entity type and performing encryption in batches for each entity type.
    this.expressionMap.parameters[parameterName] = (await encryptor.encrypt(entity.target, {
      [propertyName]: this.expressionMap.parameters[parameterName]
    }))[propertyName];
  }
}