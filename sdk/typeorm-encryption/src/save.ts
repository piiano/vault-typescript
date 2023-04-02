import {EntityManager, InstanceChecker, ObjectLiteral} from "typeorm";
import {Encryptor} from "./encryptor";
import {DeepPartial} from "typeorm/common/DeepPartial";
import {EntityTarget} from "typeorm/common/EntityTarget";
import {SaveOptions} from "typeorm/repository/SaveOptions";
import {EntityPersistExecutor} from "typeorm/persistence/EntityPersistExecutor";

type EntitySaver = EntityManager['save'];

export function saveFunc(manager: EntityManager, encryptor: Encryptor): EntitySaver {
  return async function <Entity extends ObjectLiteral, T extends DeepPartial<Entity>>(
    targetOrEntity: (T | T[]) | EntityTarget<Entity>,
    maybeEntityOrOptions?: T | T[],
    maybeOptions?: SaveOptions,
  ): Promise<T | T[]> {
    // normalize mixed parameters
    let target =
      arguments.length > 1 &&
      (typeof targetOrEntity === "function" ||
        InstanceChecker.isEntitySchema(targetOrEntity) ||
        typeof targetOrEntity === "string")
        ? (targetOrEntity as Function | string)
        : undefined
    let entity: T | T[] = target
      ? (maybeEntityOrOptions as T | T[])
      : (targetOrEntity as T | T[])
    const options = target
      ? maybeOptions
      : (maybeEntityOrOptions as SaveOptions)

    if (InstanceChecker.isEntitySchema(target)) target = target.options.name

    let clonedEntity: T | T[];
    if (Array.isArray(entity)) {
      clonedEntity = await Promise.all(entity.map(async (e) =>
        await encryptor.encrypt(target || e.constructor, e)));
    } else {
      clonedEntity = await encryptor.encrypt(target || entity.constructor, entity);
    }

    // execute save operation
    return new EntityPersistExecutor(
      manager.connection,
      manager.queryRunner,
      "save",
      target,
      clonedEntity,
      options,
    )
      .execute()
      // copy generated ids back to original entities
      .then(() => {
        if (Array.isArray(clonedEntity)) {
          return clonedEntity.map((cloned, index) =>
            Object.assign(cloned, (entity as T[])[index]))
        }
        return Object.assign(clonedEntity, entity)
      })
  }
}
