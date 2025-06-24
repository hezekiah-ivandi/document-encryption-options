import { Router } from "express";
import { AppDataSource } from "../../config/postgres-db";
import { File2 } from "../../entity/option_2/file2.entity";
import { AuthRequest } from "../../types/express";
import { Auth } from "typeorm";
import { DataEncryptionKey } from "../../entity/option_2/data-encryption-key.entity";
import { protect } from "../../middlewares/auth.middleware";
import { User } from "../../entity/user.entity";

const router = Router();
const file2Repo = AppDataSource.getRepository(File2);

router.get("/files", protect, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return;
    const files = await file2Repo.find({
      where: { owner: { id: req.user.id } },
      select: ["id", "originalName"],
    });
    res.status(200).json({ files });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e });
  }
});

router.get("/dek", protect, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const DEK = await AppDataSource.createQueryBuilder(User, "u")
      .leftJoinAndSelect("u.DEK", "dek")
      .where("u.id = :id", { id: req.user.id })
      .select(["u.id", "dek.encryptedDEK"])
      .getOne();

    res.status(200).json(DEK);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/upload", protect, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { encryptedFile, encryptedMimeType, originalName } = req.body;

    if (!encryptedFile || !encryptedMimeType || !originalName) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const file = file2Repo.create({
      encryptedFile: Buffer.from(encryptedFile, "base64"),
      encryptedMimeType: Buffer.from(encryptedMimeType, "base64"),
      originalName,
      owner: { id: req.user.id } as User,
    });

    await file2Repo.save(file);
    res.status(201).json({ message: "Encrypted File created!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e });
  }
});

router.get("/file/:id", protect, async (req: AuthRequest, res) => {
  try {
    const file = await file2Repo.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    res.status(200).json({
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
