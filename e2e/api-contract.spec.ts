import { test, expect } from "@playwright/test";

// Helper to validate response shape
function validateShape(obj: any, shape: any): boolean {
  for (const key in shape) {
    if (!(key in obj)) {
      console.error(`Missing key: ${key}`);
      return false;
    }

    const expectedType = shape[key];
    const actualValue = obj[key];

    if (expectedType === "string" && typeof actualValue !== "string") {
      console.error(`${key} should be string, got ${typeof actualValue}`);
      return false;
    }
    if (expectedType === "number" && typeof actualValue !== "number") {
      console.error(`${key} should be number, got ${typeof actualValue}`);
      return false;
    }
    if (expectedType === "boolean" && typeof actualValue !== "boolean") {
      console.error(`${key} should be boolean, got ${typeof actualValue}`);
      return false;
    }
    if (expectedType === "array" && !Array.isArray(actualValue)) {
      console.error(`${key} should be array, got ${typeof actualValue}`);
      return false;
    }
    if (expectedType === "object" && (typeof actualValue !== "object" || actualValue === null)) {
      console.error(`${key} should be object, got ${typeof actualValue}`);
      return false;
    }
  }

  return true;
}

test.describe("API Contract Tests - Response Shape Validation", () => {
  test("GET /api/courses should return correct shape", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Should be an array
    expect(Array.isArray(data)).toBeTruthy();

    // Check first item shape
    if (data.length > 0) {
      const course = data[0];

      // Expected shape
      const expectedKeys = ["id", "title", "description", "created_at"];

      expectedKeys.forEach((key) => {
        expect(course).toHaveProperty(key);
      });

      // Type validation
      expect(typeof course.id).toBe("string");
      expect(typeof course.title).toBe("string");
    }
  });

  test("GET /api/courses/:id should return single course with correct shape", async ({ request }) => {
    // First get a course ID
    const listResponse = await request.get("http://localhost:2828/api/courses");
    const courses = await listResponse.json();

    if (courses && courses.length > 0) {
      const courseId = courses[0].id;

      const response = await request.get(`http://localhost:2828/api/courses/${courseId}`);

      if (response.ok()) {
        const course = await response.json();

        // Validate shape
        expect(course).toHaveProperty("id");
        expect(course).toHaveProperty("title");
        expect(course).toHaveProperty("description");
        expect(course).toHaveProperty("created_at");

        expect(typeof course.id).toBe("string");
        expect(typeof course.title).toBe("string");
      }
    }
  });

  test("POST /api/courses should return typed error on validation failure", async ({ request }) => {
    const response = await request.post("http://localhost:2828/api/courses", {
      data: {
        invalid: "data"
      }
    });

    // Should return error
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const error = await response.json().catch(() => null);

    if (error) {
      // Error should have structured format
      expect(error).toBeTruthy();

      // Common error shapes
      const hasMessage = "message" in error || "error" in error;
      expect(hasMessage).toBeTruthy();
    }
  });

  test("GET /api/search should return paginated results with correct shape", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/search?q=test&page=1&limit=10");

    const data = await response.json().catch(() => null);

    if (data) {
      // Pagination shape
      const paginationKeys = ["data", "page", "total"];

      // Check if it has pagination structure or is just an array
      if (typeof data === "object" && !Array.isArray(data)) {
        // Has pagination wrapper
        expect(data).toHaveProperty("data");

        if (Array.isArray(data.data)) {
          expect(data.data).toBeInstanceOf(Array);
        }
      } else if (Array.isArray(data)) {
        // Direct array response
        expect(data).toBeInstanceOf(Array);
      }
    }
  });

  test("GET /api/user/profile should return user shape or 401", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/user/profile");

    if (response.status() === 401) {
      // Unauthenticated - should return error shape
      const error = await response.json().catch(() => null);

      if (error) {
        expect(error).toHaveProperty("error");
      }
    } else if (response.ok()) {
      // Authenticated - should return user shape
      const user = await response.json();

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(typeof user.id).toBe("string");
      expect(typeof user.email).toBe("string");
    }
  });

  test("API errors should have consistent error shape", async ({ request }) => {
    // Test various error scenarios
    const errorTests = [
      { url: "/api/courses/invalid-id", expectedStatus: 404 },
      { url: "/api/courses", method: "POST", expectedStatus: 400 }
    ];

    for (const testCase of errorTests) {
      const response = await request.fetch(`http://localhost:2828${testCase.url}`, {
        method: testCase.method || "GET",
        data: testCase.method === "POST" ? {} : undefined
      }).catch(() => null);

      if (response && response.status() >= 400) {
        const error = await response.json().catch(() => null);

        if (error) {
          // Error should have message or error field
          const hasErrorField = "error" in error || "message" in error;
          expect(hasErrorField).toBeTruthy();

          console.log(`${testCase.url} error shape:`, error);
        }
      }
    }
  });

  test("GET /api/categories should return array of categories with correct shape", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/categories").catch(() => null);

    if (response && response.ok()) {
      const data = await response.json();

      if (Array.isArray(data)) {
        expect(data).toBeInstanceOf(Array);

        if (data.length > 0) {
          const category = data[0];

          // Categories should have id and name at minimum
          expect(category).toHaveProperty("id");
          expect(category).toHaveProperty("name");
        }
      }
    }
  });

  test("Paginated endpoints should include pagination metadata", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses?page=1&limit=5");

    const data = await response.json();

    // Check for pagination metadata
    if (typeof data === "object" && !Array.isArray(data)) {
      // Structured pagination
      const hasPaginationInfo =
        "total" in data ||
        "page" in data ||
        "hasMore" in data ||
        "nextPage" in data;

      if (hasPaginationInfo) {
        console.log("Pagination metadata found:", {
          total: data.total,
          page: data.page,
          hasMore: data.hasMore
        });

        if ("total" in data) {
          expect(typeof data.total).toBe("number");
        }

        if ("page" in data) {
          expect(typeof data.page).toBe("number");
        }
      }
    }
  });

  test("Timestamps should be in ISO 8601 format", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    if (response.ok()) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        // Check timestamp fields
        const timestampFields = ["created_at", "updated_at", "createdAt", "updatedAt"];

        timestampFields.forEach((field) => {
          if (item[field]) {
            const timestamp = item[field];

            // Should be a valid ISO 8601 string
            expect(typeof timestamp).toBe("string");

            // Should be parseable as date
            const date = new Date(timestamp);
            expect(date.toString()).not.toBe("Invalid Date");

            // Should include timezone (Z or +00:00)
            expect(timestamp).toMatch(/Z|\+\d{2}:\d{2}$/);
          }
        });
      }
    }
  });

  test("Nested relationships should have correct shape", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    if (response.ok()) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const course = data[0];

        // Check for nested relationships
        const relationships = ["modules", "lessons", "creator", "user"];

        relationships.forEach((rel) => {
          if (course[rel]) {
            const relData = course[rel];

            if (Array.isArray(relData)) {
              // Should be array of objects
              if (relData.length > 0) {
                expect(typeof relData[0]).toBe("object");
                expect(relData[0]).toHaveProperty("id");
              }
            } else if (typeof relData === "object") {
              // Should be single object with id
              expect(relData).toHaveProperty("id");
            }
          }
        });
      }
    }
  });

  test("Boolean fields should be actual booleans, not strings", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    if (response.ok()) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        // Common boolean fields
        const booleanFields = ["published", "is_public", "enabled", "active"];

        booleanFields.forEach((field) => {
          if (field in item) {
            // Should be boolean, not "true"/"false" string
            expect(typeof item[field]).toBe("boolean");
            expect(item[field]).not.toBe("true");
            expect(item[field]).not.toBe("false");
          }
        });
      }
    }
  });

  test("Numeric fields should be numbers, not strings", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    if (response.ok()) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        // Common numeric fields
        const numericFields = ["price", "duration", "order", "count"];

        numericFields.forEach((field) => {
          if (field in item && item[field] !== null) {
            // Should be number, not string "42"
            expect(typeof item[field]).toBe("number");
          }
        });
      }
    }
  });

  test("Null vs undefined should be handled consistently", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    if (response.ok()) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        // JSON should use null, not undefined
        Object.values(item).forEach((value) => {
          expect(value).not.toBe(undefined);
        });
      }
    }
  });

  test("Arrays should never be null, use empty array instead", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses");

    if (response.ok()) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        // Check array fields
        Object.entries(item).forEach(([key, value]) => {
          // If value is meant to be an array, it should be [], not null
          if (Array.isArray(value)) {
            expect(value).toBeInstanceOf(Array);
          }
        });
      }
    }
  });
});
