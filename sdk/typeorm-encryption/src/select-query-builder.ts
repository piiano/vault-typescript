// import {FindManyOptions, ObjectLiteral, QueryRunner, SelectQueryBuilder} from "typeorm";
//
// export class CustomSelectQueryBuilder<Entity extends ObjectLiteral> extends SelectQueryBuilder<Entity> {
//
//   // @ts-ignore
//   async executeEntitiesAndRawResults(queryRunner: QueryRunner): Promise<{ entities: Entity[]; raw: any[]; }> {
//     super.expressionMap.wheres // TODO: encrypt encrypted fields
//     super.expressionMap.whereEntities // TODO: encrypt encrypted fields
//     super.expressionMap.selects // TODO: handle transformations
//     super.expressionMap.selectDistinctOn // TODO: handle transformations
//     super.expressionMap.groupBys // TODO: handle transformations
//     super.expressionMap.extraReturningColumns // TODO: handle transformations
//     super.expressionMap.orderBys // TODO: handle transformations
//     super.expressionMap.parameters // TODO: handle transformations
//     super.expressionMap.returning // TODO: handle transformations
//
//     console.log()
//
//     return super.executeEntitiesAndRawResults(queryRunner);
//   }
// }