// __tests__/api/admin/packages.test.ts
// Integration tests for package CRUD APIs
// Test IDs: SH-PKG-001 through SH-PKG-004

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
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  order: jest.fn(),
  maybeSingle: jest.fn(),
};

// Chain setup
function chainAll() {
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
}

jest.mock("@/lib/supabase/server", () => ({
  supabaseServer: () => mockSupabase,
}));

const mockAdminSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  order: jest.fn(),
};

function chainAdmin() {
  mockAdminSupabase.from.mockReturnValue(mockAdminSupabase);
  mockAdminSupabase.select.mockReturnValue(mockAdminSupabase);
  mockAdminSupabase.insert.mockReturnValue(mockAdminSupabase);
  mockAdminSupabase.update.mockReturnValue(mockAdminSupabase);
  mockAdminSupabase.delete.mockReturnValue(mockAdminSupabase);
  mockAdminSupabase.eq.mockReturnValue(mockAdminSupabase);
  mockAdminSupabase.order.mockReturnValue(mockAdminSupabase);
}

jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockAdminSupabase,
}));

describe("Admin Package CRUD API - sh-085", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJson.mockImplementation((data: unknown, options?: { status?: number }) => ({
      data,
      status: options?.status || 200,
    }));
  });

  function setupAdmin() {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
    });
    chainAll();
    mockSupabase.single.mockResolvedValue({
      data: { role: "admin" },
    });
  }

  function setupNonAdmin() {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@test.com" } },
    });
    chainAll();
    mockSupabase.single.mockResolvedValue({
      data: { role: "user" },
    });
  }

  function setupUnauthenticated() {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });
  }

  function makeRequest(body?: Record<string, unknown>) {
    return {
      json: () => Promise.resolve(body || {}),
    } as unknown as Request;
  }

  describe("SH-PKG-001: Create package", () => {
    it("should create a package with valid data", async () => {
      setupAdmin();
      chainAdmin();
      mockAdminSupabase.single.mockResolvedValue({
        data: {
          id: "pkg-new-1",
          name: "Test Agent",
          slug: "test-agent",
          type: "LOCAL_AGENT",
        },
        error: null,
      });

      const { POST } = await import("@/app/api/admin/packages/route");
      await POST(makeRequest({
        name: "Test Agent",
        slug: "test-agent",
        type: "LOCAL_AGENT",
        tagline: "A test agent",
        description: "Test description",
      }));

      expect(mockJson).toHaveBeenCalled();
      const [responseData, responseOptions] = mockJson.mock.calls[0];
      expect(responseOptions?.status).toBe(201);
      expect(responseData.package).toBeDefined();
    });

    it("should return 409 for duplicate slug", async () => {
      setupAdmin();
      chainAdmin();
      mockAdminSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key" },
      });

      const { POST } = await import("@/app/api/admin/packages/route");
      await POST(makeRequest({
        name: "Test Agent",
        slug: "test-agent",
        type: "LOCAL_AGENT",
        tagline: "A test agent",
        description: "Test description",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("slug already exists") }),
        expect.objectContaining({ status: 409 })
      );
    });
  });

  describe("SH-PKG-002: List packages (GET)", () => {
    it("should list all packages for admin", async () => {
      setupAdmin();
      chainAdmin();

      // Override order chain to return data
      mockAdminSupabase.order.mockReturnValueOnce({
        ...mockAdminSupabase,
        order: jest.fn().mockResolvedValue({
          data: [
            { id: "pkg-1", name: "Agent 1", type: "LOCAL_AGENT" },
            { id: "pkg-2", name: "App 2", type: "CLOUD_APP" },
          ],
          error: null,
        }),
      });

      const { GET } = await import("@/app/api/admin/packages/route");
      await GET(makeRequest());

      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.packages).toBeDefined();
    });
  });

  describe("SH-PKG-003: Validation", () => {
    it("should reject invalid package type", async () => {
      setupAdmin();

      const { POST } = await import("@/app/api/admin/packages/route");
      await POST(makeRequest({
        name: "Test",
        slug: "test",
        type: "INVALID_TYPE",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() }),
        expect.objectContaining({ status: 400 })
      );
    });
  });

  describe("SH-PKG-004: Auth checks", () => {
    it("should return 403 for non-admin user", async () => {
      setupNonAdmin();

      const { GET } = await import("@/app/api/admin/packages/route");
      await GET(makeRequest());

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Forbidden" }),
        expect.objectContaining({ status: 403 })
      );
    });

    it("should return 403 for unauthenticated request", async () => {
      setupUnauthenticated();

      const { GET } = await import("@/app/api/admin/packages/route");
      await GET(makeRequest());

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Forbidden" }),
        expect.objectContaining({ status: 403 })
      );
    });

    it("should return 403 for POST from non-admin", async () => {
      setupNonAdmin();

      const { POST } = await import("@/app/api/admin/packages/route");
      await POST(makeRequest({
        name: "Hacked Package",
        slug: "hacked",
        type: "LOCAL_AGENT",
      }));

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Forbidden" }),
        expect.objectContaining({ status: 403 })
      );
    });
  });
});
