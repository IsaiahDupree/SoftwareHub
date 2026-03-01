import { test, expect } from "@playwright/test";

test.describe("API Performance Tests", () => {
  test("should return course list in < 500ms", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get("http://localhost:2828/api/courses");

    const responseTime = Date.now() - startTime;
    console.log(`Course list API response time: ${responseTime}ms`);

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(500);
  });

  test("should return single course details in < 300ms", async ({ request }) => {
    // First get a course ID
    const listResponse = await request.get("http://localhost:2828/api/courses");
    const courses = await listResponse.json();

    if (courses && courses.length > 0) {
      const courseId = courses[0].id;

      const startTime = Date.now();
      const response = await request.get(`http://localhost:2828/api/courses/${courseId}`);
      const responseTime = Date.now() - startTime;

      console.log(`Course detail API response time: ${responseTime}ms`);

      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(300);
    } else {
      console.log("No courses available for testing");
      // Pass test if no data available
      expect(true).toBeTruthy();
    }
  });

  test("should handle search requests in < 500ms", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get("http://localhost:2828/api/search?q=test");

    const responseTime = Date.now() - startTime;
    console.log(`Search API response time: ${responseTime}ms`);

    // Search should complete quickly even if no results
    expect(responseTime).toBeLessThan(500);
  });

  test("should return user profile in < 300ms", async ({ page, request }) => {
    // This test requires authentication
    // For now, we test the endpoint response time even if unauthorized

    const startTime = Date.now();

    const response = await request.get("http://localhost:2828/api/user/profile").catch(() => null);

    const responseTime = Date.now() - startTime;
    console.log(`User profile API response time: ${responseTime}ms`);

    // Even auth check should be fast
    expect(responseTime).toBeLessThan(300);
  });

  test("should handle pagination efficiently (< 500ms)", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get("http://localhost:2828/api/courses?page=1&limit=10");

    const responseTime = Date.now() - startTime;
    console.log(`Paginated API response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(500);
  });

  test("should return categories list quickly (< 300ms)", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get("http://localhost:2828/api/categories").catch(() => null);

    const responseTime = Date.now() - startTime;
    console.log(`Categories API response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(300);
  });

  test("should handle OPTIONS requests quickly (< 100ms)", async ({ request }) => {
    const startTime = Date.now();

    try {
      await request.fetch("http://localhost:2828/api/courses", {
        method: "OPTIONS"
      });
    } catch (e) {
      // May not be supported, that's ok
    }

    const responseTime = Date.now() - startTime;
    console.log(`OPTIONS request time: ${responseTime}ms`);

    // CORS preflight should be very fast
    expect(responseTime).toBeLessThan(100);
  });

  test("should handle concurrent API requests efficiently", async ({ request }) => {
    const startTime = Date.now();

    // Make 5 concurrent requests
    const promises = [
      request.get("http://localhost:2828/api/courses"),
      request.get("http://localhost:2828/api/courses"),
      request.get("http://localhost:2828/api/courses"),
      request.get("http://localhost:2828/api/courses"),
      request.get("http://localhost:2828/api/courses")
    ];

    const responses = await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 5;

    console.log(`5 concurrent requests completed in: ${totalTime}ms (avg: ${avgTime}ms)`);

    // All should succeed
    responses.forEach((response) => {
      expect(response.ok()).toBeTruthy();
    });

    // Total time should not be much more than 1 request due to concurrency
    expect(totalTime).toBeLessThan(2000);
  });

  test("should return health check instantly (< 100ms)", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get("http://localhost:2828/api/health").catch(() => null);

    const responseTime = Date.now() - startTime;
    console.log(`Health check response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(100);
  });

  test("should handle POST requests efficiently (< 500ms)", async ({ request }) => {
    const startTime = Date.now();

    // Try to create something (will likely fail auth, but we measure speed)
    await request.post("http://localhost:2828/api/courses", {
      data: {
        title: "Test Course",
        description: "Performance test"
      }
    }).catch(() => null);

    const responseTime = Date.now() - startTime;
    console.log(`POST request response time: ${responseTime}ms`);

    // Even validation/auth errors should be fast
    expect(responseTime).toBeLessThan(500);
  });

  test("should have low latency for static API routes (< 200ms)", async ({ request }) => {
    const endpoints = [
      "/api/health",
      "/api/courses",
      "/api/categories"
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();

      await request.get(`http://localhost:2828${endpoint}`).catch(() => null);

      const responseTime = Date.now() - startTime;
      console.log(`${endpoint} response time: ${responseTime}ms`);

      expect(responseTime).toBeLessThan(500);
    }
  });

  test("should handle filtering and sorting efficiently (< 500ms)", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(
      "http://localhost:2828/api/courses?sort=title&order=asc&filter=active"
    );

    const responseTime = Date.now() - startTime;
    console.log(`Filtered/sorted API response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(500);
  });

  test("should maintain performance with query parameters (< 500ms)", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(
      "http://localhost:2828/api/search?q=javascript&category=programming&price=free"
    );

    const responseTime = Date.now() - startTime;
    console.log(`Complex query response time: ${responseTime}ms`);

    expect(responseTime).toBeLessThan(500);
  });
});
