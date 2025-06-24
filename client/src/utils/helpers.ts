export async function toUint8Array<T>(input: T): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof input === "string") return new TextEncoder().encode(input);
  if (typeof input === "number") {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, input, true);
    return new Uint8Array(buffer);
  }
  if (typeof input === "boolean") {
    return new Uint8Array([input ? 1 : 0]);
  }
  if (input instanceof File || input instanceof Blob) {
    const buffer = await input.arrayBuffer();
    return new Uint8Array(buffer);
  }
  if (typeof input === "object") {
    const json = JSON.stringify(input);
    return new TextEncoder().encode(json);
  }

  throw new Error("Unsupported input type for encryption");
}

export function splitIvAndCiphertext(encryptedPayload: ArrayBuffer): {
  iv: Uint8Array;
  encryptedData: Uint8Array;
} {
  console.log(encryptedPayload);
  const allBytes = new Uint8Array(encryptedPayload);
  console.log(allBytes);
  const iv = allBytes.slice(0, 12);
  console.log(iv);
  const encryptedData = allBytes.slice(12);
  console.log(encryptedData);
  return { iv, encryptedData };
}

export function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryString = atob(base64);

  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  return byteArray.buffer;
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  console.log("length: ", base64.length);
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

export async function encrypt<T>(
  input: T,
  RAW_AES_KEY: Uint8Array<ArrayBuffer> | ArrayBuffer
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const AES_KEY = await crypto.subtle.importKey(
    "raw",
    RAW_AES_KEY,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const inputBuffer = await toUint8Array<typeof input>(input);
  const encryptedInputBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    AES_KEY,
    inputBuffer
  );

  //Concat encrypted IV with encrypted input buffer
  const encryptedPayload = new Uint8Array(
    iv.length + encryptedInputBuffer.byteLength
  );
  encryptedPayload.set(iv, 0);
  encryptedPayload.set(new Uint8Array(encryptedInputBuffer), iv.length);

  return encryptedPayload;
}

export async function downloadFile(
  decryptedFile: ArrayBuffer,
  mimetype: string,
  originalName: string
) {
  const blob = new Blob([decryptedFile], { type: mimetype });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = originalName;
  a.click();
  URL.revokeObjectURL(url);
}
