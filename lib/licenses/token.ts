import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface ActivationTokenPayload extends JWTPayload {
  lid: string; // license_id
  pid: string; // package_id
  did: string; // device_id_hash
  uid: string; // user_id
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.LICENSE_JWT_SECRET || 'default-dev-secret-change-in-production'
);

const TOKEN_EXPIRY = '30d';

/**
 * Generate a JWT activation token with 30-day expiry.
 */
export async function generateActivationToken(payload: {
  licenseId: string;
  packageId: string;
  deviceIdHash: string;
  userId: string;
}): Promise<string> {
  const token = await new SignJWT({
    lid: payload.licenseId,
    pid: payload.packageId,
    did: payload.deviceIdHash,
    uid: payload.userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Validate and decode a JWT activation token.
 * Throws if the token is invalid or expired.
 */
export async function validateActivationToken(
  token: string
): Promise<ActivationTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as ActivationTokenPayload;
}
