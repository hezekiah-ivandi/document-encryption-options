import { Request, Router } from "express";
import { AppDataSource } from "../config/postgres-db";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { User } from "../entity/user.entity";
import { protect } from "../middlewares/auth.middleware";
import { AuthRequest } from "../types/express";
import crypto from "crypto";
import { DataEncryptionKey } from "../entity/option_2/data-encryption-key.entity";
const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AppDataSource.createQueryBuilder(User, "u")
      .leftJoinAndSelect("u.DEK", "dek")
      .where("u.email = :email", { email })
      .getOne();

    if (!user) {
      console.log(user);
      res.status(404).json({ message: "User doesn't exist" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials!" });
      return;
    }

    const token = generateToken(user.id, user.email);

    res.status(200).json({
      message: "Login successful",
      accessToken: token,
      mekSalt: user.DEK.MEKSalt,
      encryptedDEK: user.DEK.encryptedDEK.toString("base64"),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("body: ", req.body);
    const user = await AppDataSource.createQueryBuilder(User, "u")
      .where("u.email = :email", { email })
      .getOne();

    if (user) {
      res.status(409).json({ message: `User with ${email} already exist` });
      return;
    }

    //Derive MEK from password
    const mekSalt = crypto.randomBytes(16);
    const MEK = crypto.pbkdf2Sync(password, mekSalt, 100_000, 32, "sha256");

    //Generate DEK key from each user
    const DEK = crypto.randomBytes(32);
    const DEK_IV = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", MEK, DEK_IV);
    const encryptedDEK = Buffer.concat([cipher.update(DEK), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const DEK_PAYLOAD = Buffer.concat([DEK_IV, encryptedDEK, authTag]);

    const dekInstanceId = await AppDataSource.createQueryBuilder()
      .insert()
      .into(DataEncryptionKey)
      .values({
        encryptedDEK: DEK_PAYLOAD,
        MEKSalt: mekSalt.toString("base64"),
      })
      .returning(["id"])
      .execute();

    const hashedPassword = await bcrypt.hash(password, 10);
    await AppDataSource.createQueryBuilder()
      .insert()
      .into(User)
      .values({
        email,
        password: hashedPassword,
        DEK: {
          id: dekInstanceId.generatedMaps[0].id,
        } as DataEncryptionKey,
      })
      .execute();
    res.status(201).json({ message: "Register sucessful!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

router.get("/auth/me", protect, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized!" });
    return;
  }
  res.status(200).json(req.user);
});

export default router;
