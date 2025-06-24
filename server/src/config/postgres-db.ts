import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "../entity/user.entity";
import { File } from "../entity/option_1/file.entity";
import { DataEncryptionKey } from "../entity/option_2/data-encryption-key.entity";
import { File2 } from "../entity/option_2/file2.entity";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || ""),
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  synchronize: true,
  logging: false,
  entities: [User, File, DataEncryptionKey, File2],
  migrations: [],
  subscribers: [],
});
