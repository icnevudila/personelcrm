import crypto from "node:crypto";

function encryptionKey() {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error("CREDENTIAL_ENCRYPTION_KEY en az 32 karakter olarak server ortamında tanımlanmalıdır.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptJson(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), ciphertext: ciphertext.toString("base64url") });
}

export function decryptJson(value) {
  const payload = typeof value === "string" ? JSON.parse(value) : value;
  if (payload?.v !== 1 || !payload.iv || !payload.tag || !payload.ciphertext) throw new Error("Şifrelenmiş bağlantı verisi geçersiz.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(payload.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64url")), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8"));
}
