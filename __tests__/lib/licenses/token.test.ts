// __tests__/lib/licenses/token.test.ts
// Test suite for JWT activation token generation/validation
// Test IDs: SH-TOK-001 through SH-TOK-004
//
// jose is ESM-only so we mock it for jest compatibility.

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock jose module before importing token module
const mockSign = jest.fn().mockResolvedValue("header.payload.signature");
const mockJwtVerify = jest.fn();

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    return {
      _payload: payload,
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: mockSign,
    };
  }),
  jwtVerify: mockJwtVerify,
}));

describe("JWT Activation Token - sh-082", () => {
  const testPayload = {
    licenseId: "lic-123-456",
    packageId: "pkg-789-012",
    deviceIdHash: "abc123def456",
    userId: "user-999",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LICENSE_JWT_SECRET = "test-secret-for-jwt-tests-at-least-32-chars-long";
    mockSign.mockResolvedValue("header.payload.signature");
    mockJwtVerify.mockResolvedValue({
      payload: {
        lid: testPayload.licenseId,
        pid: testPayload.packageId,
        did: testPayload.deviceIdHash,
        uid: testPayload.userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    });
  });

  describe("SH-TOK-001: Token generation", () => {
    it("should generate a non-empty JWT string", async () => {
      const { generateActivationToken } = await import("@/lib/licenses/token");
      const token = await generateActivationToken(testPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should call SignJWT with correct payload fields", async () => {
      const { SignJWT } = await import("jose");
      const { generateActivationToken } = await import("@/lib/licenses/token");
      await generateActivationToken(testPayload);

      expect(SignJWT).toHaveBeenCalledWith({
        lid: testPayload.licenseId,
        pid: testPayload.packageId,
        did: testPayload.deviceIdHash,
        uid: testPayload.userId,
      });
    });

    it("should set HS256 algorithm header", async () => {
      const { generateActivationToken } = await import("@/lib/licenses/token");
      await generateActivationToken(testPayload);

      const { SignJWT } = await import("jose");
      const instance = (SignJWT as unknown as jest.Mock).mock.results[0].value;
      expect(instance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
    });

    it("should set expiration time to 30d", async () => {
      const { generateActivationToken } = await import("@/lib/licenses/token");
      await generateActivationToken(testPayload);

      const { SignJWT } = await import("jose");
      const instance = (SignJWT as unknown as jest.Mock).mock.results[0].value;
      expect(instance.setExpirationTime).toHaveBeenCalledWith("30d");
    });

    it("should generate different tokens for different payloads", async () => {
      let callCount = 0;
      mockSign.mockImplementation(() => {
        callCount++;
        return Promise.resolve(`token-${callCount}`);
      });

      const { generateActivationToken } = await import("@/lib/licenses/token");
      const token1 = await generateActivationToken(testPayload);
      const token2 = await generateActivationToken({
        ...testPayload,
        deviceIdHash: "different-device",
      });
      expect(token1).not.toBe(token2);
    });
  });

  describe("SH-TOK-002: Token validation", () => {
    it("should validate a token successfully", async () => {
      const { validateActivationToken } = await import("@/lib/licenses/token");
      const decoded = await validateActivationToken("valid-token");
      expect(decoded).toBeDefined();
      expect(decoded.lid).toBe(testPayload.licenseId);
      expect(decoded.pid).toBe(testPayload.packageId);
    });

    it("should return payload with standard JWT claims (iat, exp)", async () => {
      const { validateActivationToken } = await import("@/lib/licenses/token");
      const decoded = await validateActivationToken("valid-token");
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.iat).toBe("number");
      expect(typeof decoded.exp).toBe("number");
    });

    it("should return payload with ~30 days expiration", async () => {
      const { validateActivationToken } = await import("@/lib/licenses/token");
      const decoded = await validateActivationToken("valid-token");
      const iat = decoded.iat!;
      const exp = decoded.exp!;
      const diffDays = (exp - iat) / (60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  describe("SH-TOK-003: Expiration handling", () => {
    it("should include exp claim that is in the future", async () => {
      const { validateActivationToken } = await import("@/lib/licenses/token");
      const decoded = await validateActivationToken("valid-token");
      const nowSeconds = Math.floor(Date.now() / 1000);
      expect(decoded.exp!).toBeGreaterThan(nowSeconds);
    });
  });

  describe("SH-TOK-004: Invalid token handling", () => {
    it("should reject a completely invalid string", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid Compact JWS"));
      const { validateActivationToken } = await import("@/lib/licenses/token");
      await expect(validateActivationToken("not-a-valid-jwt")).rejects.toThrow();
    });

    it("should reject a tampered token", async () => {
      mockJwtVerify.mockRejectedValue(new Error("signature verification failed"));
      const { validateActivationToken } = await import("@/lib/licenses/token");
      await expect(validateActivationToken("tampered.jwt.token")).rejects.toThrow();
    });

    it("should reject an expired token", async () => {
      mockJwtVerify.mockRejectedValue(new Error('"exp" claim timestamp check failed'));
      const { validateActivationToken } = await import("@/lib/licenses/token");
      await expect(validateActivationToken("expired.jwt.token")).rejects.toThrow();
    });

    it("should reject an empty string", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid Compact JWS"));
      const { validateActivationToken } = await import("@/lib/licenses/token");
      await expect(validateActivationToken("")).rejects.toThrow();
    });
  });
});
