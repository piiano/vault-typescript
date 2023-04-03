import {EntityManager, InsertResult, InstanceChecker, ObjectLiteral} from "typeorm";
import {Encryptor} from "./encryptor";
import {EntityTarget} from "typeorm/common/EntityTarget";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";

type EntityInserter = EntityManager['insert'];

export function insertFunc(manager: EntityManager, encryptor: Encryptor): EntityInserter {
  const insert = manager.insert.bind(manager);

  return async function <Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
    entity:
      | QueryDeepPartialEntity<Entity>
      | QueryDeepPartialEntity<Entity>[],
  ): Promise<InsertResult> {
    if (InstanceChecker.isEntitySchema(target)) target = target.options.name;

    const encryptedEntity = await encryptor.encrypt(target as Function | string, entity);

    return insert(target, encryptedEntity);
  };
}
