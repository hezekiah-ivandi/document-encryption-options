import express from "express";
import { v4 as uuidv4 } from "uuid";
import { encryptWithAES, generateRSAKeyPair } from "../../utils/crypto-utils";
import { AppDataSource } from "../../config/postgres-db";
import { File } from "../../entity/option_1/file.entity";
import { protect } from "../../middlewares/auth.middleware";
import { AuthRequest } from "../../types/express";
import { User } from "../../entity/user.entity";
import crypto from "crypto";

const router = express.Router();
const fileRepo = AppDataSource.getRepository(File);

/*Option 1 routes*/

//Get files
router.get("/files", protect, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const files = await fileRepo.find({
      where: { owner: { id: req.user.id } as User },
      select: ["id", "originalName"],
    });

    res.status(200).json({ files });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e });
  }
});

//Upload file
router.post("/upload", protect, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const { encryptedKey, encryptedFile, encryptedMimeType, originalName } =
      req.body;

    if (!encryptedFile || !encryptedKey) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const fileEntity = fileRepo.create({
      encryptedKey,
      encryptedFile: Buffer.from(encryptedFile, "base64"),
      encryptedMimeType: Buffer.from(encryptedMimeType, "base64"),
      originalName,
      owner: { id: req.user.id } as User,
    });

    await fileRepo.save(fileEntity);

    res
      .status(201)
      .json({ id: fileEntity.id, message: "File securely uploaded!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e });
  }
});

//Get public rsa key (kek)
router.get("/publicKey", protect, async (req, res) => {
  const RSA_PUBLIC_KEY = process.env.RSA_PUBLIC!.replace(/\\n/g, "\n");
  res.type("text/plain").send(RSA_PUBLIC_KEY);
});

//Get file & decrypted document encryption key (DEK)
router.get("/file/:id", protect, async (req: AuthRequest, res) => {
  try {
    const file = await fileRepo.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!file) {
      res.status(404).json({ message: "Fiel not found" });
      return;
    }

    const privateKey = process.env.RSA_PRIVATE!.replace(/\\n/g, "\n");

    //Decrypt file's AES-KEY with rsa private key
    const AES_KEY_BUFFER = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(file.encryptedKey, "base64")
    );

    res.status(200).json({
      decryptedKey: AES_KEY_BUFFER.toString("base64"),
      encryptedFile: file.encryptedFile.toString("base64"),
      encryptedMimeType: file.encryptedMimeType.toString("base64"),
      originalName: file.originalName,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e });
  }
});

export default router;
