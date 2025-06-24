import { tokenizedAxios } from "@/lib/axios";
import {
  base64ToArrayBuffer,
  bufferToBase64,
  downloadFile,
  encrypt,
  splitIvAndCiphertext,
} from "./helpers";
export async function encryptAndUpload2(file: File) {
  const BASE64_RAW_DEK = localStorage.getItem("DEK");
  if (!BASE64_RAW_DEK || !file) return;

  const RAW_DEK = base64ToArrayBuffer(BASE64_RAW_DEK);
  const encryptedFile = await encrypt(file, RAW_DEK);
  const encryptedMimeType = await encrypt(file.type, RAW_DEK);

  await tokenizedAxios.post("/option_2/upload", {
    encryptedFile: bufferToBase64(encryptedFile),
    encryptedMimeType: bufferToBase64(encryptedMimeType),
    originalName: file.name,
  });
}
export async function decryptAndDownloadFile2(fileId: number) {
  const { decryptedFile, mimetype, originalName } = await getAndDecryptFile2(
    fileId
  );
  await downloadFile(decryptedFile, mimetype, originalName);
}

export async function deriveMEK(mekSalt: string, password: string) {
  console.log(mekSalt, password);
  const encoder = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const MEK = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToArrayBuffer(mekSalt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  return MEK;
}
export async function decryptAndGenerateUrl2(fileId: number) {
  const { decryptedFile, mimetype, originalName } = await getAndDecryptFile2(
    fileId
  );
  const blob = new Blob([decryptedFile], { type: mimetype });
  const url = URL.createObjectURL(blob);

  return url;
}
/*
Helpers*/

async function retrieveDEK() {
  const BASE64_AES_KEY = localStorage.getItem("DEK");
  if (!BASE64_AES_KEY) return;
  const RAW_AES_KEY = base64ToArrayBuffer(BASE64_AES_KEY);
  const DEK = await crypto.subtle.importKey(
    "raw",
    RAW_AES_KEY,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  return DEK;
}

export async function getAndDecryptDEK(
  MEK: CryptoKey,
  encryptedDEK: ArrayBuffer
) {
  //Split Encrypted DEK into two parts: IV and ciphertext (with auth tag)
  const { iv, encryptedData } = splitIvAndCiphertext(encryptedDEK);

  //Decrypt DEK
  const decryptedDEK = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    MEK,
    encryptedData
  );

  return decryptedDEK;
}

async function getAndDecryptFile2(fileId: number) {
  const DEK = await retrieveDEK();
  if (!DEK) {
    throw new Error("DEK not found");
  }

  //Get encrypted file and its meta data
  const { data } = await tokenizedAxios.get(`/option_2/file/${fileId}`);
  const { encryptedFile, encryptedMimeType, originalName } = data;

  //extract iv from encrypted file
  const encryptedFilePayload = splitIvAndCiphertext(
    base64ToArrayBuffer(encryptedFile)
  );
  const decryptedFile = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encryptedFilePayload.iv },
    DEK,
    encryptedFilePayload.encryptedData
  );

  const encryptedMimeTypePayload = splitIvAndCiphertext(
    base64ToArrayBuffer(encryptedMimeType)
  );
  const decryptedMimeType = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encryptedMimeTypePayload.iv },
    DEK,
    encryptedMimeTypePayload.encryptedData
  );
  const decoder = new TextDecoder();

  return {
    decryptedFile,
    mimetype: decoder.decode(decryptedMimeType),
    originalName,
  };
}
