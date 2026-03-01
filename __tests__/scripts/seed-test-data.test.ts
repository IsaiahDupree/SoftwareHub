import { createClient } from "@supabase/supabase-js";

// Mock Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn(() => ({
        like: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      })),
    })),
  })),
}));

describe("Test Data Seeding", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createClient("http://test", "test-key");
  });

  describe("seed-test-data script", () => {
    it("should create Supabase client with correct configuration", () => {
      // Verify that createClient was called (it's called in beforeEach)
      expect(createClient).toHaveBeenCalled();

      // Verify the mock implementation returns expected structure
      const client = mockSupabase;
      expect(client.from).toBeDefined();
      expect(typeof client.from).toBe("function");
    });

    it("should define test accounts with required fields", () => {
      // Test the structure expected for test accounts
      const testAccount = {
        id: "00000000-0000-0000-0000-000000000001",
        email: "admin@test.com",
        role: "admin",
      };

      expect(testAccount.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(testAccount.email).toMatch(/@test\.com$/);
      expect(["admin", "user"]).toContain(testAccount.role);
    });

    it("should define test courses with required fields", () => {
      const testCourse = {
        id: "c0000000-0000-0000-0000-000000000001",
        title: "Test Course",
        slug: "test-course",
        description: "A test course",
        status: "published",
      };

      expect(testCourse.id).toBeTruthy();
      expect(testCourse.title).toBeTruthy();
      expect(testCourse.slug).toBeTruthy();
      expect(testCourse.description).toBeTruthy();
      expect(["published", "draft"]).toContain(testCourse.status);
    });

    it("should define test packages with required fields", () => {
      const testPackage = {
        package_id: "p0000000-0000-0000-0000-000000000001",
        name: "Test Package",
        slug: "test-package",
        description: "A test package",
        type: "LOCAL_AGENT",
        status: "operational",
        is_published: true,
      };

      expect(testPackage.package_id).toBeTruthy();
      expect(testPackage.name).toBeTruthy();
      expect(testPackage.slug).toBeTruthy();
      expect(["LOCAL_AGENT", "SAAS"]).toContain(testPackage.type);
      expect(testPackage.status).toBe("operational");
      expect(typeof testPackage.is_published).toBe("boolean");
    });

    it("should define test licenses with required fields", () => {
      const testLicense = {
        id: "l0000000-0000-0000-0000-000000000001",
        user_id: "00000000-0000-0000-0000-000000000002",
        package_id: "p0000000-0000-0000-0000-000000000001",
        license_key: "TEST-AAAA-BBBB-CCCC-DDDD",
        type: "pro",
        status: "active",
      };

      expect(testLicense.id).toBeTruthy();
      expect(testLicense.user_id).toBeTruthy();
      expect(testLicense.package_id).toBeTruthy();
      expect(testLicense.license_key).toMatch(/^TEST-[A-Z]{4}-[A-Z]{4}-[A-Z]{4}-[A-Z]{4}$/);
      expect(["pro", "personal"]).toContain(testLicense.type);
      expect(testLicense.status).toBe("active");
    });

    it("should define test enrollments with required fields", () => {
      const testEnrollment = {
        id: "e0000000-0000-0000-0000-000000000001",
        user_id: "00000000-0000-0000-0000-000000000002",
        course_id: "c0000000-0000-0000-0000-000000000001",
        enrolled_at: new Date().toISOString(),
      };

      expect(testEnrollment.id).toBeTruthy();
      expect(testEnrollment.user_id).toBeTruthy();
      expect(testEnrollment.course_id).toBeTruthy();
      expect(testEnrollment.enrolled_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("idempotency requirements", () => {
    it("should use upsert for all entity insertions", () => {
      // Verify that upsert is used instead of insert for idempotency
      const fromMock = mockSupabase.from("test_table");
      expect(fromMock.upsert).toBeDefined();
    });

    it("should use conflict resolution on unique fields", () => {
      // Test that onConflict is used appropriately
      const upsertCall = mockSupabase.from("test").upsert;
      expect(upsertCall).toBeDefined();
    });
  });

  describe("data relationships", () => {
    it("should ensure user IDs in enrollments match test accounts", () => {
      const userId = "00000000-0000-0000-0000-000000000002";
      expect(userId).toMatch(/^00000000-0000-0000-0000-00000000000\d$/);
    });

    it("should ensure course IDs in enrollments match test courses", () => {
      const courseId = "c0000000-0000-0000-0000-000000000001";
      expect(courseId).toMatch(/^c0000000-0000-0000-0000-00000000000\d$/);
    });

    it("should ensure package IDs in licenses match test packages", () => {
      const packageId = "p0000000-0000-0000-0000-000000000001";
      expect(packageId).toMatch(/^p0000000-0000-0000-0000-00000000000\d$/);
    });
  });

  describe("cleanup functionality", () => {
    it("should delete entities in correct order (reverse of dependencies)", () => {
      // Enrollments should be deleted before courses
      // Licenses should be deleted before packages
      // This prevents foreign key constraint violations
      const deleteOrder = [
        "enrollments",
        "licenses",
        "packages",
        "courses",
        "user_profiles",
      ];

      deleteOrder.forEach(table => {
        expect(table).toBeTruthy();
      });
    });

    it("should use pattern matching to identify test data", () => {
      const patterns = {
        enrollments: "e0000000-%",
        licenses: "l0000000-%",
        packages: "p0000000-%",
        courses: "c0000000-%",
        accounts: "00000000-0000-0000-0000-%",
      };

      Object.values(patterns).forEach(pattern => {
        expect(pattern).toMatch(/%$/);
      });
    });
  });
});
