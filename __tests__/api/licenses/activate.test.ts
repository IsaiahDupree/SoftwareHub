// __tests__/api/licenses/activate.test.ts
// Integration tests for license activation API
// Test IDs: SH-ACT-001 through SH-ACT-004

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
  insert: jest.fn(),
  update: jest.fn(),
};

// Chain mock setup
function setupChain(finalResult: unknown) {
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.single.mockResolvedValue(finalResult);
}

jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabase,
}));

jest.mock("@/lib/security/rateLimit", () => ({
  checkRateLimit: () => null,
}));

jest.mock("@/lib/licenses/token", () => ({
  generateActivationToken: jest.fn().mockResolvedValue("mock-activation-token-jwt"),
}));

describe("License Activation API - sh-083", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJson.mockImplementation((data: unknown, options?: { status?: number }) => ({
      data,
      status: options?.status || 200,
    }));
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

  describe("SH-ACT-001: Successful activation", () => {
    it("should activate a device with valid license key", async () => {
      // First call: license lookup
      const licenseLookup = {
        data: {
          id: "lic-1",
          package_id: "pkg-1",
          user_id: "user-1",
          status: "active",
          expires_at: null,
          max_devices: 2,
          active_devices: 0,
          activated_at: null,
        },
      };

      // Second call: check existing activation (not found)
      const noExisting = { data: null, error: { code: "PGRST116" } };

      // Third call: insert activation
      const insertResult = { error: null };

      // Fourth call: update license device count
      const updateResult = { data: null };

      let callCount = 0;
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(licenseLookup);
        if (callCount === 2) return Promise.resolve(noExisting);
        return Promise.resolve(updateResult);
      });

      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        license_key: "ABCD-EFGH-JKLM-NPQR",
        device_id: "device-123",
        device_name: "Test Laptop",
        device_type: "laptop",
      }));

      // Should respond with token
      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.activation_token).toBeDefined();
    });
  });

  describe("SH-ACT-002: Invalid key handling", () => {
    it("should return 404 for nonexistent license key", async () => {
      setupChain({ data: null, error: { code: "PGRST116" } });

      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        license_key: "XXXX-XXXX-XXXX-XXXX",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid license key" }),
        expect.objectContaining({ status: 404 })
      );
    });

    it("should return 400 for missing license_key", async () => {
      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() }),
        expect.objectContaining({ status: 400 })
      );
    });
  });

  describe("SH-ACT-003: Device limit exceeded", () => {
    it("should return 403 when max devices reached", async () => {
      let callCount = 0;
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              id: "lic-1",
              package_id: "pkg-1",
              user_id: "user-1",
              status: "active",
              expires_at: null,
              max_devices: 2,
              active_devices: 2,
            },
          });
        }
        // No existing activation for this device
        return Promise.resolve({ data: null, error: { code: "PGRST116" } });
      });

      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        license_key: "ABCD-EFGH-JKLM-NPQR",
        device_id: "new-device-456",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Device limit exceeded",
          code: "DEVICE_LIMIT",
        }),
        expect.objectContaining({ status: 403 })
      );
    });
  });

  describe("SH-ACT-004: Already activated device", () => {
    it("should refresh token for already activated device", async () => {
      let callCount = 0;
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              id: "lic-1",
              package_id: "pkg-1",
              user_id: "user-1",
              status: "active",
              expires_at: null,
              max_devices: 2,
              active_devices: 1,
            },
          });
        }
        if (callCount === 2) {
          return Promise.resolve({
            data: {
              id: "act-1",
              is_active: true,
              app_version: "1.0.0",
            },
          });
        }
        return Promise.resolve({ data: null });
      });

      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        license_key: "ABCD-EFGH-JKLM-NPQR",
        device_id: "existing-device",
      }));

      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.activation_token).toBeDefined();
    });
  });

  describe("License status checks", () => {
    it("should reject suspended license", async () => {
      setupChain({
        data: {
          id: "lic-1",
          status: "suspended",
        },
      });

      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        license_key: "ABCD-EFGH-JKLM-NPQR",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ code: "LICENSE_INACTIVE" }),
        expect.objectContaining({ status: 403 })
      );
    });

    it("should reject expired license", async () => {
      setupChain({
        data: {
          id: "lic-1",
          status: "active",
          expires_at: "2020-01-01T00:00:00Z", // expired
        },
      });

      const { POST } = await import("@/app/api/licenses/activate/route");
      await POST(makeRequest({
        license_key: "ABCD-EFGH-JKLM-NPQR",
        device_id: "device-123",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ code: "LICENSE_EXPIRED" }),
        expect.objectContaining({ status: 403 })
      );
    });
  });
});
