import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Custom password hashing for Better Auth that is compatible with the
// existing users.password_hash format created by the seed:
//
//   `scrypt$<salt>$<hash>`
//
// where <salt> is a 16-byte salt hex-encoded (32 chars) and <hash> is a
// 64-byte derived key hex-encoded (128 chars). The seed generated these
// with Node's `scryptSync(password, salt, 64)` defaults:
//
//   N = 16384, r = 8, p = 1, dkLen = 64
//
// IMPORTANT:
//   - The salt is passed to scrypt as the SAME hex string the seed used
//     (Node treats the string as raw bytes). Do NOT decode it to bytes.
//   - Passwords are used verbatim (no NFKC normalization) so existing
//     hashes keep verifying.
//   - users.password_hash is NEVER rewritten — this only reads it.

export const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  dkLen: 64,
} as const;

const SALT_BYTES = 16;
const PREFIX = "scrypt";
const MAXMEM = 128 * SCRYPT_PARAMS.N * SCRYPT_PARAMS.r * 2;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  const { N, r, p, dkLen } = SCRYPT_PARAMS;
  return new Promise((resolve, reject) => {
    scrypt(password, salt, dkLen, { N, r, p, maxmem: MAXMEM }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const key = await deriveKey(password, salt);
  return `${PREFIX}$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(data: { hash: string; password: string }): Promise<boolean> {
  const { hash, password } = data;
  const parts = hash.split("$");
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;

  const [, salt, storedHex] = parts;
  if (!salt || !storedHex) return false;

  let stored: Buffer;
  try {
    stored = Buffer.from(storedHex, "hex");
  } catch {
    return false;
  }
  if (stored.length !== SCRYPT_PARAMS.dkLen) return false;

  const derived = await deriveKey(password, salt);
  return timingSafeEqual(derived, stored);
}
