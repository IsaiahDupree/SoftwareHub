import { SignJWT, jwtVerify } from 'jose';

const SSO_SECRET = new TextEncoder().encode(
  process.env.CLOUD_SSO_SECRET || process.env.LICENSE_JWT_SECRET || 'dev-sso-secret'
);

interface SSOTokenPayload {
  userId: string;
  email: string;
  packageId: string;
  entitlements: string[];
}

interface SSOTokenDecoded {
  sub: string;
  email: string;
  pid: string;
  ents: string[];
  iat: number;
  exp: number;
  jti: string;
}

export async function generateSSOToken(payload: SSOTokenPayload): Promise<string> {
  const jti = crypto.randomUUID();

  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    pid: payload.packageId,
    ents: payload.entitlements,
    jti,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m') // 5-minute expiry
    .sign(SSO_SECRET);
}

export async function verifySSOToken(token: string): Promise<SSOTokenDecoded> {
  const { payload } = await jwtVerify(token, SSO_SECRET);
  return payload as unknown as SSOTokenDecoded;
}
