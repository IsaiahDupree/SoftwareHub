// __tests__/api/licenses/validate.test.ts
// Integration tests for license validation API
// Test IDs: SH-VAL-001 through SH-VAL-004

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockJson = jest.fn().mockImplementation((data: unknown, options?: { status?: number }) => ({
  data,
  status: options?.status || 200,
}));

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: { json: mockJson },
}));

const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  update: jest.fn(),
};

jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabase,
}));

jest.mock("@/lib/security/rateLimit", () => ({
  checkRateLimit: () => null,
}));

// Mock validateActivationToken
const mockValidateToken = jest.fn();
jest.mock("@/lib/licenses/token", () => ({
  validateActivationToken: mockValidateToken,
}));

// Mock hashDeviceId
jest.mock("@/lib/licenses/hash", () => ({
  hashDeviceId: (id: string) => `hash_${id}`,
  hashLicenseKey: (key: string) => `hash_${key}`,
}));

describe("License Validation API - sh-084", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJson.mockImplementation((data: unknown, options?: { status?: number }) => ({
      data,
      status: options?.status || 200,
    }));
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
  });

  function makeRequest(body: Record<string, unknown>) {
    return {
      json: () => Promise.resolve(body),
      headers: {
        get: () => "127.0.0.1",
      },
      ip: "127.0.0.1",
    } as unknown as import("next/server").NextRequest;
  }

  describe("SH-VAL-001: Valid token", () => {
    it("should validate a valid activation token", async () => {
      mockValidateToken.mockResolvedValue({
        lid: "lic-1",
        pid: "pkg-1",
        did: "hash_device-123",
        uid: "user-1",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 30,
      });

      let callCount = 0;
      mockSupabase.single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              id: "lic-1",
              package_id: "pkg-1",
              status: "active",
              license_type: "standard",
              expires_at: null,
            },
          });
        }
        return Promise.resolve({ data: null });
      });

      const { POST } = await import("@/app/api/licenses/validate/route");
      await POST(makeRequest({
        activation_token: "valid-jwt-token",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response.valid).toBe(true);
      expect(response.license_id).toBe("lic-1");
    });
  });

  describe("SH-VAL-002: Expired token", () => {
    it("should reject an expired JWT token", async () => {
      mockValidateToken.mockRejectedValue(new Error("Token expired"));

      const { POST } = await import("@/app/api/licenses/validate/route");
      await POST(makeRequest({
        activation_token: "expired-token",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: false,
          code: "TOKEN_INVALID",
        }),
        expect.objectContaining({ status: 401 })
      );
    });
  });

  describe("SH-VAL-003: Device mismatch", () => {
    it("should reject when device ID doesn't match token", async () => {
      mockValidateToken.mockResolvedValue({
        lid: "lic-1",
        pid: "pkg-1",
        did: "hash_different-device",
        uid: "user-1",
      });

      const { POST } = await import("@/app/api/licenses/validate/route");
      await POST(makeRequest({
        activation_token: "valid-token",
        device_id: "wrong-device",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: false,
          code: "DEVICE_MISMATCH",
        }),
        expect.objectContaining({ status: 403 })
      );
    });
  });

  describe("SH-VAL-004: Revoked license", () => {
    it("should reject a revoked license", async () => {
      mockValidateToken.mockResolvedValue({
        lid: "lic-1",
        pid: "pkg-1",
        did: "hash_device-123",
        uid: "user-1",
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: "lic-1",
          package_id: "pkg-1",
          status: "revoked",
          license_type: "standard",
          expires_at: null,
        },
      });

      const { POST } = await import("@/app/api/licenses/validate/route");
      await POST(makeRequest({
        activation_token: "valid-token",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: false,
          code: "LICENSE_REVOKED",
        }),
        expect.objectContaining({ status: 403 })
      );
    });

    it("should reject a suspended license", async () => {
      mockValidateToken.mockResolvedValue({
        lid: "lic-1",
        pid: "pkg-1",
        did: "hash_device-123",
        uid: "user-1",
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: "lic-1",
          package_id: "pkg-1",
          status: "suspended",
          license_type: "standard",
          expires_at: null,
        },
      });

      const { POST } = await import("@/app/api/licenses/validate/route");
      await POST(makeRequest({
        activation_token: "valid-token",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: false,
          code: "LICENSE_SUSPENDED",
        }),
        expect.objectContaining({ status: 403 })
      );
    });
  });

  describe("Grace period handling", () => {
    it("should return grace_period true for recently expired license", async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      mockValidateToken.mockResolvedValue({
        lid: "lic-1",
        pid: "pkg-1",
        did: "hash_device-123",
        uid: "user-1",
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: "lic-1",
          package_id: "pkg-1",
          status: "active",
          license_type: "standard",
          expires_at: twoDaysAgo.toISOString(),
        },
      });

      const { POST } = await import("@/app/api/licenses/validate/route");
      await POST(makeRequest({
        activation_token: "valid-token",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response.valid).toBe(true);
      expect(response.grace_period).toBe(true);
    });
  });
});
