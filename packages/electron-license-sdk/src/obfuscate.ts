// =============================================================================
// SoftwareHub Electron License SDK - String Obfuscation Utility
// =============================================================================
// Adds an extra layer of obfuscation for sensitive strings stored on disk.
//
// SECURITY NOTE:
// This is NOT a cryptographic guarantee. It makes stored license tokens
// significantly harder to read if someone inspects the electron-store data
// file directly. The primary security layer is:
//   1. electron-store encryptionKey (AES-256 based on machine identity)
//   2. OS-level file permissions / keychain integration
//
// This XOR layer adds defense-in-depth for the activation token specifically.
// =============================================================================

import * as crypto from 'crypto';

const OBFUSCATION_NAMESPACE = 'softwarehub-v1';

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic obfuscation key from a salt string.
 * Returns a 32-byte Buffer.
 */
function deriveKey(salt: string): Buffer {
  return crypto.createHash('sha256').update(salt).digest();
}

// ---------------------------------------------------------------------------
// XOR cipher (byte-level, cycles key)
// ---------------------------------------------------------------------------

/**
 * XOR a Buffer of data against a key Buffer (cycling the key as needed).
 * Returns a new Buffer with the XOR-ed result.
 */
function xorBuffers(data: Buffer, key: Buffer): Buffer {
  const result = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public: Generic obfuscation
// ---------------------------------------------------------------------------

/**
 * Obfuscate a UTF-8 string using XOR with a key derived from `salt`.
 * The result is a hex-encoded string safe for storage.
 *
 * @param value - The plaintext string to obfuscate
 * @param salt  - A stable, non-secret salt that must match on deobfuscation
 * @returns     Hex-encoded obfuscated string
 */
export function obfuscateString(value: string, salt: string): string {
  const key = deriveKey(salt);
  const data = Buffer.from(value, 'utf8');
  const obfuscated = xorBuffers(data, key);
  return obfuscated.toString('hex');
}

/**
 * Deobfuscate a hex-encoded string previously obfuscated with `obfuscateString`.
 * Returns the original plaintext string.
 *
 * @param obfuscated - Hex-encoded obfuscated string
 * @param salt       - The same salt used during obfuscation
 * @returns          The original plaintext string
 * @throws           If the input is not valid hex or deobfuscation fails
 */
export function deobfuscateString(obfuscated: string, salt: string): string {
  const key = deriveKey(salt);
  const data = Buffer.from(obfuscated, 'hex');
  const plaintext = xorBuffers(data, key);
  return plaintext.toString('utf8');
}

// ---------------------------------------------------------------------------
// Public: Activation token obfuscation
// ---------------------------------------------------------------------------

/**
 * Derive the obfuscation salt for an activation token.
 * The salt is deterministic based on the package slug and device ID,
 * so it can be re-derived at read time without additional storage.
 */
function tokenSalt(packageSlug: string, deviceId: string): string {
  return `${packageSlug}-${deviceId}-${OBFUSCATION_NAMESPACE}`;
}

/**
 * Obfuscate an activation token before storing it in electron-store.
 *
 * The resulting string is hex-encoded and safe for JSON storage.
 * If obfuscation fails for any reason, the original token is returned
 * unchanged to avoid data loss (the encryption layer still protects it).
 *
 * @param token       - The raw JWT activation token
 * @param packageSlug - The package slug (e.g. "watermark-remover")
 * @param deviceId    - The device ID stored alongside the token
 * @returns           Hex-encoded obfuscated token
 */
export function obfuscateToken(token: string, packageSlug: string, deviceId: string): string {
  try {
    const salt = tokenSalt(packageSlug, deviceId);
    return obfuscateString(token, salt);
  } catch (err) {
    // Obfuscation failure should never block activation — fall back to plain token
    console.warn('[SoftwareHub License] Token obfuscation failed, storing plain token:', err);
    return token;
  }
}

/**
 * Deobfuscate an activation token after reading it from electron-store.
 *
 * Detects whether the stored value is obfuscated (valid hex that decodes to a
 * non-empty string) or plain (for backward compatibility with previously stored
 * unobfuscated tokens). Falls back to returning the value as-is on any error.
 *
 * @param obfuscated  - The stored token (may be hex-obfuscated or plain)
 * @param packageSlug - The package slug used during obfuscation
 * @param deviceId    - The device ID used during obfuscation
 * @returns           The original plaintext activation token
 */
export function deobfuscateToken(obfuscated: string, packageSlug: string, deviceId: string): string {
  // Quick check: if it doesn't look like hex, it's a plain (legacy) token
  if (!isHexString(obfuscated)) {
    return obfuscated;
  }

  try {
    const salt = tokenSalt(packageSlug, deviceId);
    const decoded = deobfuscateString(obfuscated, salt);

    // Sanity check: decoded result should look like a JWT (contains dots)
    // or at minimum be a non-empty string. If not, treat as legacy plain value.
    if (!decoded || decoded.trim() === '') {
      return obfuscated;
    }

    return decoded;
  } catch {
    // Deobfuscation failed — may be a legacy unobfuscated token
    return obfuscated;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the string consists entirely of valid hex characters
 * and has even length (required for hex-encoded bytes).
 */
function isHexString(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}
