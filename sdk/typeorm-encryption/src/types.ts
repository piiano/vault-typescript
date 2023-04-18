/// <reference types="typeorm" />


import {ObjectLiteral} from "typeorm/common/ObjectLiteral";

declare module "typeorm/query-builder/SelectQueryBuilder" {
  interface SelectQueryBuilder<Entity extends ObjectLiteral> {
    transformations: { [key: string]: string[] };
    handleQueryEncryptedParameters(encryptor: Encryptor): Promise<void>;
  }
}

declare module "typeorm/metadata/ColumnMetadata" {
  interface ColumnMetadata {
    isEncrypted: boolean;
    vaultFieldName: string;
  }
}

type EncryptedColumnMetadata = ColumnMetadata & { transformation: string };

import {ColumnMetadata} from "typeorm/metadata/ColumnMetadata";
import {Encryptor} from "./encryptor";
declare module "typeorm/metadata/EntityMetadata" {
  interface EntityMetadata {
    findEncryptedColumnWithPropertyPath(propertyPath: string): EncryptedColumnMetadata | undefined;
  }
}

declare module "typeorm/decorator/options/ColumnCommonOptions" {
  interface ColumnCommonOptions {
    encrypt?: boolean;
    vaultField?: string;
  }
}

export type WithTransformations<Entity, Arguments extends unknown[] = any[]> = (
  Entity & { [key: `${string}.${string}`]: any; }
) extends infer NewEntity ?
  NewEntity & (new(...arguments_: Arguments) => NewEntity): never;

export function withTransformations<Entity = any>(entity: Entity): WithTransformations<Entity> {
  return entity as any;
}
