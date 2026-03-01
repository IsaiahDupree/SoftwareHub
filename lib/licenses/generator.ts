/**
 * License Key Generator
 *
 * Generates cryptographically secure license keys for software products.
 */

import { randomBytes } from "crypto";

const PACKAGE_PREFIXES: Record<string, string> = {
  "watermark-remover": "WATERMARK",
  "tts-studio": "TTS",
  "auto-comment": "AUTOCOM",
  "auto-dm": "AUTODM",
  "kalodata-scraper": "KALODATA",
  "competitor-research": "COMPRES",
  "everreach-crm": "EVERREACH",
  "sora-video": "SORA",
};

/**
 * Generates a unique license key for a package
 *
 * Format: PREFIX-XXXX-XXXX-XXXX-XXXX
 * Example: WATERMARK-A1B2-C3D4-E5F6-G7H8
 */
export function generateLicenseKey(packageSlug: string): string {
  const prefix = PACKAGE_PREFIXES[packageSlug] || "GENERIC";

  // Generate 4 segments of 4 characters each
  const segments = Array.from({ length: 4 }, () => {
    return randomBytes(2)
      .toString("hex")
      .toUpperCase()
      .slice(0, 4);
  });

  return `${prefix}-${segments.join("-")}`;
}

/**
 * Validates license key format
 *
 * @param key License key to validate
 * @returns true if format is valid
 */
export function validateLicenseKeyFormat(key: string): boolean {
  // Format: PREFIX-XXXX-XXXX-XXXX-XXXX
  // - Prefix can be letters/numbers
  // - Each segment must be exactly 4 alphanumeric characters
  // - All uppercase
  const pattern = /^[A-Z0-9]+-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}

/**
 * Checks if a license key is unique in the database
 *
 * @param key License key to check
 * @returns true if unique, false if already exists
 */
export async function isLicenseKeyUnique(key: string): Promise<boolean> {
  // In real implementation, this would query the database
  // For now, return true (stub)
  return true;
}

/**
 * Generates a unique license key with database uniqueness check
 *
 * @param packageSlug Package slug
 * @param maxAttempts Maximum number of attempts to generate unique key
 * @returns Unique license key
 */
export async function generateUniqueLicenseKey(
  packageSlug: string,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = generateLicenseKey(packageSlug);
    const isUnique = await isLicenseKeyUnique(key);

    if (isUnique) {
      return key;
    }
  }

  throw new Error(
    `Failed to generate unique license key after ${maxAttempts} attempts`
  );
}
