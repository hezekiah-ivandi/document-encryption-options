import { tokenizedAxios } from "@/lib/axios";
import {
  base64ToArrayBuffer,
  bufferToBase64,
  downloadFile,
  encrypt,
  pemToArrayBuffer,
  splitIvAndCiphertext,
  toUint8Array,
} from "./helpers";

// Encrypt & Upload file
export async function encryptAndUpload(file: File) {
  const RAW_AES_KEY = crypto.getRandomValues(new Uint8Array(32));

  //Encrypt data with AES_CRYPTO_KEY
  const encryptedFileBuffer = await encrypt(file, RAW_AES_KEY);

  //Encrypt meta data
  const encryptedMimeTypeBuffer = await encrypt(file.type, RAW_AES_KEY);

  //Fetch PLATFORM public RSA KEY (pem)
  const RSA_PUBLIC_KEY_PEM = await tokenizedAxios
    .get("/option_1/publicKey")
    .then((res) => res.data); //fetch public key from server (to encrypt AES key)

  const RSA_PUBLIC_KEY = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(RSA_PUBLIC_KEY_PEM),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  //Encrypt FILE AES KEY with RSA_PUBLIC_KEY
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    RSA_PUBLIC_KEY,
    RAW_AES_KEY
  );

  //Upload File
  await tokenizedAxios.post("/option_1/upload", {
    encryptedKey: bufferToBase64(encryptedKeyBuffer),
    encryptedFile: bufferToBase64(encryptedFileBuffer),
    encryptedMimeType: bufferToBase64(encryptedMimeTypeBuffer),
    originalName: file.name,
  });
}

//Decrypt & Download file
export async function decryptAndDownloadFile(fileId: number) {
  const { decryptedFile, mimetype, originalName } = await getAndDecryptFile(
    fileId
  );

  //Download file
  await downloadFile(decryptedFile, mimetype, originalName);
}

//Decrypt & View file
export async function decryptAndGenerateUrl(fileId: number) {
  const { decryptedFile, mimetype, originalName } = await getAndDecryptFile(
    fileId
  );

  const blob = new Blob([decryptedFile], { type: mimetype });
  const url = URL.createObjectURL(blob);

  return url;
}

/*
  Type for file (from server)
*/

type ServerFile = {
  decryptedKey: string; //Base64
  iv: string;
  encryptedFile: string; //Base64
  originalName: string;
  encryptedMimeType: string;
};

//Get & Decrypt file
const getAndDecryptFile = async (fileId: number) => {
  const { data } = await tokenizedAxios.get(`/option_1/file/${fileId}`);
  const { decryptedKey, encryptedFile, encryptedMimeType, originalName } =
    data as ServerFile;

  //Import AES KEY
  const AES_KEY = await crypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(decryptedKey),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  //Decrypt file with AES KEY
  const encryptedFilePayload = splitIvAndCiphertext(
    base64ToArrayBuffer(encryptedFile)
  );
  const decryptedFile = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encryptedFilePayload.iv },
    AES_KEY,
    encryptedFilePayload.encryptedData
  );

  //Decrypt metadata
  const encryptedMimePayload = splitIvAndCiphertext(
    base64ToArrayBuffer(encryptedMimeType)
  );
  const mimetypeBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encryptedMimePayload.iv },
    AES_KEY,
    encryptedMimePayload.encryptedData
  );
  const decoder = new TextDecoder();
  return {
    decryptedFile,
    mimetype: decoder.decode(mimetypeBuffer),
    originalName,
  };
};
