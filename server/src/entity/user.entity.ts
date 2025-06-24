import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { File } from "./option_1/file.entity";
import { DataEncryptionKey } from "./option_2/data-encryption-key.entity";
import { File2 } from "./option_2/file2.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => File, (file) => file.owner)
  files: File[];

  @OneToMany(() => File2, (file2) => file2.owner)
  files2: File2[];

  @OneToOne(() => DataEncryptionKey, (dek) => dek.user)
  @JoinColumn()
  DEK: DataEncryptionKey;
}
