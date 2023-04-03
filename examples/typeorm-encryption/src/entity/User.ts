import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({encrypt: true})
  name: string;

  @Column({encrypt: true})
  email: string;

  @Column({encrypt: true, vaultField: "phone_number"})
  phone: string;

  @Column({encrypt: true})
  ssn: string;

  @Column()
  state: string;
}
