import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

export abstract class Account extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({encrypt: true})
  name: string;

  @Column({encrypt: true})
  email: string;
}

@Entity()
export class Seller extends Account {

  @Column({encrypt: true})
  bankAccount: string;
}

@Entity()
export class Buyer extends Account {

  @Column({encrypt: true})
  cardNumber: string;

  @Column({encrypt: true})
  cardHolderName: string;

  @Column({encrypt: true})
  cardExpiration: string;
}
