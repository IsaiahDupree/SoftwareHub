import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashLicenseKey } from './hash';

const LICENSE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a license key in XXXX-XXXX-XXXX-XXXX format.
 * Uses crypto-secure random bytes and excludes confusing characters (0, O, 1, I, L).
 */
export function generateLicenseKeySync(): string {
  const bytes = randomBytes(16);
  let key = '';

  for (let i = 0; i < 16; i++) {
    const index = bytes[i] % LICENSE_CHARS.length;
    key += LICENSE_CHARS[index];
    if (i === 3 || i === 7 || i === 11) {
      key += '-';
    }
  }

  return key;
}

/**
 * Generate a unique license key, checking the database for uniqueness.
 */
export async function generateUniqueLicenseKey(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const key = generateLicenseKeySync();
    const keyHash = hashLicenseKey(key);

    // Check if this key already exists
    const { data } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('license_key_hash', keyHash)
      .single();

    if (!data) {
      return key;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique license key after maximum attempts');
}
