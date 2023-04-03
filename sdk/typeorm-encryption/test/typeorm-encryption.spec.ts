import {Customer} from "./entity/customer";
import {expect} from "chai";
import {Buyer, Seller} from "./entity/commerce";
import {BaseEntity, DataSource, EntityManager, ObjectLiteral, ObjectType} from "typeorm";
import {DeepPartial} from "typeorm/common/DeepPartial";

describe('typeorm encryption',  function () {

  it('should work with entity manager', async function () {
    const tests = testCases()

    const manager: EntityManager = this.dataSource.manager;

    const added = await manager.save(tests.map(({entityToAdd}) => entityToAdd));

    expect(added).to.be.lengthOf(tests.length);

    for (let i = 0; i < tests.length; i++) {
      expect(added[i]).to.have.property('id');

      const { modifications, entityToAdd, entityClass,
        normalizedEntityToAdd, normalizedModifications  } = tests[i];

      const addedWithInsertResult = await manager.insert(entityClass, { ...entityToAdd });

      expect(addedWithInsertResult).to.have.property('identifiers').with.lengthOf(1);
      expect(addedWithInsertResult.identifiers[0]).to.have.property('id');

      for (const id of [added[i].id, addedWithInsertResult.identifiers[0].id]) {

        const entity = await manager.findOneBy(entityClass, { id });

        expect(entity).to.deep.equal({ ...entityToAdd, ...normalizedEntityToAdd, id });

        const updateEntityResult = await manager.update(entityClass, { id }, modifications);

        expect(updateEntityResult.affected).to.equal(1);

        const updatedEntity = await manager.findOneBy(entityClass, { id });

        expect(updatedEntity).to.deep.equal({ ...entity, ...modifications, ...normalizedModifications, id });
      }
    }
  });

  it('should work with entity repository', async function () {
    const tests = testCases()

    for (let i = 0; i < tests.length; i++) {
      const { modifications, entityToAdd, entityClass,
        normalizedEntityToAdd, normalizedModifications, findByProp  } = tests[i];

      const repository = (this.dataSource as DataSource).getRepository(entityClass);

      const addedEntityWithSave = await repository.save(entityToAdd);

      expect(addedEntityWithSave).to.have.property('id');

      const { id, ...entityToAddWithInsert } = addedEntityWithSave;

      const addedEntityWithInsertResult = await repository.insert(entityToAddWithInsert);

      expect(addedEntityWithInsertResult).to.have.property('identifiers').with.lengthOf(1);
      expect(addedEntityWithInsertResult.identifiers[0]).to.have.property('id');

      const ids = [id, addedEntityWithInsertResult.identifiers[0].id];
      for (const addedEntityID of ids) {
        const id = addedEntityID;

        const entity = await repository.findOneBy({ id });

        expect(entity).to.deep.equal({ ...entityToAdd, ...normalizedEntityToAdd, id });

        const updateEntityResult = await repository.update({ id }, modifications);

        expect(updateEntityResult.affected).to.equal(1);

        const updatedEntity = await repository.findOneBy({ id });

        expect(updatedEntity).to.deep.equal({ ...entity, ...modifications, ...normalizedModifications, id });
      }
    }
  });

  it('should work with entity method', async function () {
    const tests = testCases()

    for (let i = 0; i < tests.length; i++) {
      const { modifications, entityToAdd, entityClass,
        normalizedEntityToAdd, normalizedModifications  } = tests[i];

      const addedEntity = await entityToAdd.save();

      expect(addedEntity).to.have.property('id');

      const { id } = addedEntity;

      const entity = await (entityClass as (typeof BaseEntity)).findOneBy({ id } as any);

      expect(entity).to.deep.equal({ ...entityToAdd, ...normalizedEntityToAdd, id });

      const updateEntityResult = await (entityClass as (typeof BaseEntity)).update({ id } as any, modifications);

      expect(updateEntityResult.affected).to.equal(1);

      const updatedEntity = await (entityClass as (typeof BaseEntity)).findOneBy({ id } as any);

      expect(updatedEntity).to.deep.equal({ ...entity, ...modifications, ...normalizedModifications, id });
    }
  });

});

function testCases(): Array<EncryptionTest> {
  return [
    {
      name: 'regular entity (customer)',
      entityClass: Customer,
      entityToAdd: Object.assign(new Customer(), {
        name: 'John Doe',
        email: 'john@gmail.com',
        phone: '+972-54-1234567',
        ssn: '078-05-1120',
        state: 'IL',
      }),
      normalizedEntityToAdd: {
        phone: '+972541234567',
      },
      modifications: {
        email: 'johndoe@example.com',
      },
      findByProp: 'email',
    },
    {
      name: 'entity with inheritance (buyers)',
      entityClass: Buyer,
      entityToAdd: Object.assign(new Buyer(), {
        name: 'Shawn Kemp',
        email: 'shawnkemp@example.com',
        cardNumber: '4111-1111-1111-1111',
        cardHolderName: 'Shawn K',
        cardExpiration: '12/2023',
      }),
      normalizedEntityToAdd: {
        cardNumber: '4111111111111111',
      },
      modifications: {
        cardNumber: '3700 0000 0000 002',
        cardExpiration: '11/2027',
      },
      normalizedModifications: {
        cardNumber: '370000000000002',
      },
      findByProp: 'cardNumber',
    },
    {
      name: 'entity with inheritance (sellers)',
      entityClass: Seller,
      entityToAdd: Object.assign(new Seller(), {
        name: 'Reggie Miller',
        email: 'reggiemiller@example.com',
        bankAccount: '1234567890'
      }),
      modifications: {
        bankAccount: '0987654321'
      },
      findByProp: 'bankAccount',
    },
  ];
}

type EncryptionTest<Entity extends ObjectLiteral & BaseEntity = any> = {
  name: string;
  entityClass: ObjectType<Entity>;
  entityToAdd: Entity;
  normalizedEntityToAdd?: DeepPartial<Entity>;
  modifications: DeepPartial<Entity>;
  normalizedModifications?: DeepPartial<Entity>;
  findByProp: string;
}
