import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../user.entity";
@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.files, { onDelete: "SET NULL" })
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @Column("bytea")
  encryptedFile: Buffer;

  @Column("text")
  encryptedKey: string;

  @Column()
  originalName: string;

  @Column("bytea")
  encryptedMimeType: Buffer;

  @CreateDateColumn()
  uploadedAt: Date;
}
