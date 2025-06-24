import crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

export function generateRSAKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  return { publicKey, privateKey };
}

export function encryptWithAES(data: string): string {
  const AES_KEY = Buffer.from(process.env.AES_KEY!, "base64");

  const iv = crypto.randomBytes(12); // GCM IV = 12 bytes
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}
