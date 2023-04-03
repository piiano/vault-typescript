import {EntityManager, InstanceChecker, ObjectID, ObjectLiteral, TypeORMError, UpdateResult} from "typeorm";
import {Encryptor} from "./encryptor";
import {DeepPartial} from "typeorm/common/DeepPartial";
import {EntityTarget} from "typeorm/common/EntityTarget";
import {SaveOptions} from "typeorm/repository/SaveOptions";
import {EntityPersistExecutor} from "typeorm/persistence/EntityPersistExecutor";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";

type EntityUpdater = EntityManager['update'];

export function updateFunc(manager: EntityManager, encryptor: Encryptor): EntityUpdater {
  const update = manager.update.bind(manager);
  return async function <Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
    criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | any,
    partialEntity: QueryDeepPartialEntity<Entity>,
  ): Promise<UpdateResult> {
    // if user passed empty criteria or empty list of criterias, then throw an error
    if (
      criteria === undefined ||
      criteria === null ||
      criteria === "" ||
      (Array.isArray(criteria) && criteria.length === 0)
    ) {
      return Promise.reject(
        new TypeORMError(
          `Empty criteria(s) are not allowed for the update method.`,
        ),
      )
    }

    if (InstanceChecker.isEntitySchema(target)) target = target.options.name;

    partialEntity = await encryptor.encrypt(target as Function | string, partialEntity)

    return update(target, criteria, partialEntity);
  }
}
