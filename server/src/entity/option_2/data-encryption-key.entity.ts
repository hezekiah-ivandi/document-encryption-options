import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user.entity";

@Entity()
export class DataEncryptionKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bytea" })
  encryptedDEK: Buffer;

  @Column()
  MEKSalt: string;

  @OneToOne(() => User)
  user: User;
}
