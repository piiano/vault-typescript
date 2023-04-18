import {EntityMetadataBuilder} from "typeorm/metadata-builder/EntityMetadataBuilder";
import {EntityMetadata, getMetadataArgsStorage} from "typeorm";

// extend the EntityMetadataBuilder to extract the extra Vault parameters from the decorators
// This will allow us to access the extra Vault parameters from the entity metadata without having to re-extract them from the decorators
export function extendEntityMetadataBuilder() {
  // extract the original build method
  const build = EntityMetadataBuilder.prototype.build;
  // override the build method with our own
  EntityMetadataBuilder.prototype.build = function (this: EntityMetadataBuilder, entityClasses?: Function[]): EntityMetadata[] {
    // call the original build method as if it is a method of this class (with `this` as the context)
    const entitiesMetadata = build.bind(this)(entityClasses);
    // get the raw metadata from the decorators
    const metadata = getMetadataArgsStorage()
    // enrich the entities metadata with the extra Vault parameters extracted from the decorators
    for (const entityMetadata of entitiesMetadata) {
      // find the raw metadata for the columns of this entity
      const rawColumnsMetadata = metadata.filterColumns(entityMetadata.target)
      // enrich the columns metadata with the extra Vault parameters extracted from the decorators
      for (const columnMetadata of entityMetadata.columns) {
        const rawColumn = rawColumnsMetadata
          .find(rawColumnMetadata => rawColumnMetadata.propertyName === columnMetadata.propertyName);
        columnMetadata.isEncrypted = (rawColumn?.mode === 'regular' && rawColumn?.options?.encrypt) ?? false;
        columnMetadata.vaultFieldName = rawColumn?.options?.vaultField ?? rawColumn?.options?.name ?? columnMetadata.propertyName;
      }

      // extend entityMetadata with a custom method to find encrypted column with a given property path
      entityMetadata.findEncryptedColumnWithPropertyPath = findEncryptedColumnWithPropertyPath;
    }
    // return the enriched entities metadata
    return entitiesMetadata;
  }
}


function findEncryptedColumnWithPropertyPath(this: EntityMetadata, propertyPath: string) {
  const dotIndex= propertyPath.lastIndexOf('.');
  const columnName = dotIndex === -1 ? propertyPath : propertyPath.slice(0, dotIndex);
  const column = this.findColumnWithPropertyPathStrict(columnName);
  if (!column) return undefined;
  const transformation = column.vaultFieldName +(dotIndex === -1 ? '' : propertyPath.slice(dotIndex));

  return column?.isEncrypted ? Object.assign({transformation}, column) : undefined;
}