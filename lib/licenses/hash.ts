import { createHash } from 'crypto';

/**
 * Hash a license key using SHA256 for secure storage and lookups.
 * The hash is consistent, so the same key always produces the same hash.
 */
export function hashLicenseKey(licenseKey: string): string {
  return createHash('sha256')
    .update(licenseKey.toUpperCase().trim())
    .digest('hex');
}

/**
 * Hash a device ID using SHA256 for privacy.
 */
export function hashDeviceId(deviceId: string): string {
  return createHash('sha256')
    .update(deviceId.trim())
    .digest('hex');
}
