import '../../'; // required for extending typeorm types
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({encrypt: true})
  name: string;

  @Column({encrypt: true})
  email: string;

  @Column({encrypt: true, vaultField: 'phone_number'})
  phone: string;

  @Column({encrypt: true})
  ssn: string;

  // TODO: Fix this issue with Date type
  // @Column({encrypt: true})
  // dob: Date;

  @Column()
  state: string;
}
