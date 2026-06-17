/**
 * Credentials Vault — AES-256-GCM encryption for OAuth tokens stored in the DB.
 *
 * Requires env var:
 *   CREDENTIALS_ENCRYPTION_KEY — 32 bytes, base64-encoded
 *   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Encrypted format (all joined with ':'):
 *   <iv hex>:<auth-tag hex>:<ciphertext hex>
 *
 * Usage:
 *   const enc = encryptToken(accessToken);   // store this in DB
 *   const raw = decryptToken(enc);           // use this to call the API
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit IV recommended for GCM
const TAG_BYTES = 16;  // 128-bit auth tag

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY is not set. Generate one with:\n' +
      "  node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `CREDENTIALS_ENCRYPTION_KEY must be 32 bytes when decoded (got ${key.length}). Re-generate it.`
    );
  }
  return key;
}

/**
 * Encrypt a plaintext string. Returns a ':'-delimited hex string safe to store in DB.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypt a value produced by encryptToken(). Throws if tampered.
 */
export function decryptToken(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format — expected iv:tag:ciphertext');
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  if (iv.length !== IV_BYTES) throw new Error('Invalid IV length');
  if (tag.length !== TAG_BYTES) throw new Error('Invalid auth tag length');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

/**
 * Returns true if the value looks like a vault-encrypted token.
 * Use this to avoid double-encrypting already-encrypted values.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  // IV is 12 bytes = 24 hex chars, tag is 16 bytes = 32 hex chars
  return parts[0].length === IV_BYTES * 2 && parts[1].length === TAG_BYTES * 2;
}

/**
 * Encrypt only if not already encrypted. Safe to call idempotently.
 */
export function safeEncrypt(value: string): string {
  return isEncrypted(value) ? value : encryptToken(value);
}

/**
 * Decrypt only if encrypted. Returns plain values unchanged.
 * Useful when migrating a mix of plain and encrypted tokens in the DB.
 */
export function safeDecrypt(value: string): string {
  return isEncrypted(value) ? decryptToken(value) : value;
}
