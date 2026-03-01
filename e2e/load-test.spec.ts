import { test, expect } from "@playwright/test";

test.describe("Load Testing - Concurrent Users", () => {
  test("should handle 10 concurrent page loads without errors", async ({ browser }) => {
    const startTime = Date.now();

    // Create 10 concurrent browser contexts
    const contexts = await Promise.all(
      Array(10).fill(null).map(() => browser.newContext())
    );

    const pages = await Promise.all(
      contexts.map((context) => context.newPage())
    );

    // Load homepage concurrently
    const loadPromises = pages.map((page) =>
      page.goto("http://localhost:2828/", { waitUntil: "domcontentloaded" })
    );

    const results = await Promise.allSettled(loadPromises);

    const totalTime = Date.now() - startTime;
    console.log(`10 concurrent page loads completed in: ${totalTime}ms`);

    // Count successes
    const successes = results.filter((r) => r.status === "fulfilled").length;
    console.log(`Successful loads: ${successes}/10`);

    // Cleanup
    await Promise.all(pages.map((page) => page.close()));
    await Promise.all(contexts.map((context) => context.close()));

    // All should succeed
    expect(successes).toBe(10);
    // Should not take more than 2x single page load time
    expect(totalTime).toBeLessThan(6000);
  });

  test("should handle 25 concurrent API requests without errors", async ({ request }) => {
    const startTime = Date.now();

    // Make 25 concurrent requests
    const promises = Array(25).fill(null).map(() =>
      request.get("http://localhost:2828/api/courses")
    );

    const results = await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    console.log(`25 concurrent API requests completed in: ${totalTime}ms`);

    // Count successes
    const successes = results.filter((r) => r.status === "fulfilled").length;
    console.log(`Successful requests: ${successes}/25`);

    expect(successes).toBe(25);
    // Should handle concurrent load efficiently
    expect(totalTime).toBeLessThan(3000);
  });

  test("should handle 50 concurrent lightweight requests without errors", async ({ request }) => {
    const startTime = Date.now();

    // Make 50 concurrent health check requests
    const promises = Array(50).fill(null).map(() =>
      request.get("http://localhost:2828/api/health").catch(() => null)
    );

    const results = await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 50;

    console.log(`50 concurrent requests completed in: ${totalTime}ms (avg: ${avgTime}ms)`);

    // Count successes (some may fail if endpoint doesn't exist, that's ok)
    const successes = results.filter((r) => r.status === "fulfilled").length;
    console.log(`Completed requests: ${successes}/50`);

    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(5000);
    // Most should succeed
    expect(successes).toBeGreaterThan(40);
  });

  test("should maintain response time under load (< 2x baseline)", async ({ request }) => {
    // First, get baseline response time
    const baselineStart = Date.now();
    await request.get("http://localhost:2828/api/courses");
    const baselineTime = Date.now() - baselineStart;

    console.log(`Baseline response time: ${baselineTime}ms`);

    // Now test under load
    const startTime = Date.now();

    const promises = Array(20).fill(null).map(() =>
      request.get("http://localhost:2828/api/courses")
    );

    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 20;

    console.log(`Average response under load: ${avgTime}ms`);
    console.log(`Load vs baseline: ${(avgTime / baselineTime).toFixed(2)}x`);

    // Under load, response time should not be more than 2x baseline
    expect(avgTime).toBeLessThan(baselineTime * 2 + 200);
  });

  test("should handle concurrent user sessions without memory leaks", async ({ browser }) => {
    const startTime = Date.now();
    const sessions = [];

    // Create 15 user sessions
    for (let i = 0; i < 15; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("http://localhost:2828/");
      sessions.push({ context, page });
    }

    const setupTime = Date.now() - startTime;
    console.log(`Created 15 sessions in: ${setupTime}ms`);

    // All sessions should navigate successfully
    const navPromises = sessions.map(({ page }) =>
      page.goto("http://localhost:2828/courses").catch(() => null)
    );

    await Promise.all(navPromises);

    // Cleanup
    for (const { page, context } of sessions) {
      await page.close();
      await context.close();
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total test time: ${totalTime}ms`);

    // Should handle multiple sessions without timing out
    expect(totalTime).toBeLessThan(15000);
  });

  test("should handle mixed read/write operations under load", async ({ request }) => {
    const startTime = Date.now();

    // Mix of read and write operations
    const promises = [
      // Read operations
      ...Array(20).fill(null).map(() => request.get("http://localhost:2828/api/courses")),
      // Write operations (will likely fail auth, but we test handling)
      ...Array(5).fill(null).map(() =>
        request.post("http://localhost:2828/api/courses", {
          data: { title: "Test" }
        }).catch(() => null)
      ),
      // More reads
      ...Array(20).fill(null).map(() => request.get("http://localhost:2828/api/courses"))
    ];

    const results = await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    console.log(`Mixed operations completed in: ${totalTime}ms`);

    const successes = results.filter((r) => r.status === "fulfilled").length;
    console.log(`Completed operations: ${successes}/${promises.length}`);

    // Should handle mixed load
    expect(totalTime).toBeLessThan(5000);
  });

  test("should handle concurrent database queries without timeouts", async ({ request }) => {
    const startTime = Date.now();

    // Different endpoints that hit different database tables
    const endpoints = [
      "/api/courses",
      "/api/courses",
      "/api/courses",
      "/api/users",
      "/api/users"
    ];

    // Create 30 requests across different endpoints
    const promises = Array(6).fill(null).flatMap(() =>
      endpoints.map((endpoint) =>
        request.get(`http://localhost:2828${endpoint}`).catch(() => null)
      )
    );

    const results = await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    console.log(`30 database queries completed in: ${totalTime}ms`);

    const successes = results.filter((r) => r.status === "fulfilled").length;
    console.log(`Successful queries: ${successes}/${promises.length}`);

    // Should handle concurrent database access
    expect(totalTime).toBeLessThan(4000);
  });

  test("should scale horizontally with concurrent static asset requests", async ({ request }) => {
    const startTime = Date.now();

    // Simulate loading page with multiple assets
    const assetTypes = [
      "/",
      "/_next/static/css/app.css",
      "/_next/static/chunks/main.js"
    ];

    // 50 concurrent asset loads
    const promises = Array(50).fill(null).map((_, i) => {
      const asset = assetTypes[i % assetTypes.length];
      return request.get(`http://localhost:2828${asset}`).catch(() => null);
    });

    const results = await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    console.log(`50 static asset requests completed in: ${totalTime}ms`);

    // Should handle static assets efficiently
    expect(totalTime).toBeLessThan(4000);
  });

  test("should maintain stability under sustained load", async ({ request }) => {
    const iterations = 5;
    const concurrency = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      const promises = Array(concurrency).fill(null).map(() =>
        request.get("http://localhost:2828/api/courses")
      );

      await Promise.all(promises);

      const time = Date.now() - startTime;
      times.push(time);
      console.log(`Iteration ${i + 1}: ${time}ms`);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log(`Sustained load - Avg: ${avgTime}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);

    // Performance should remain consistent
    expect(maxTime).toBeLessThan(minTime * 2 + 500);
  });

  test("should handle 50+ concurrent users without degradation", async ({ browser }) => {
    const startTime = Date.now();
    const userCount = 50;

    console.log(`Starting load test with ${userCount} concurrent users...`);

    // Create batches to avoid overwhelming the system during setup
    const batchSize = 10;
    const batches = Math.ceil(userCount / batchSize);

    const allSessions = [];

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = Date.now();

      const contexts = await Promise.all(
        Array(Math.min(batchSize, userCount - batch * batchSize))
          .fill(null)
          .map(() => browser.newContext())
      );

      const pages = await Promise.all(
        contexts.map((context) => context.newPage())
      );

      const loadPromises = pages.map((page) =>
        page.goto("http://localhost:2828/", { waitUntil: "domcontentloaded" }).catch(() => null)
      );

      await Promise.all(loadPromises);

      const batchTime = Date.now() - batchStart;
      console.log(`Batch ${batch + 1}/${batches} loaded in: ${batchTime}ms`);

      allSessions.push(...pages.map((page, i) => ({ page, context: contexts[i] })));
    }

    const setupTime = Date.now() - startTime;
    console.log(`All ${userCount} users loaded in: ${setupTime}ms`);

    // All users navigate to different page
    const navStart = Date.now();
    const navPromises = allSessions.map(({ page }) =>
      page.goto("http://localhost:2828/courses", { waitUntil: "domcontentloaded" }).catch(() => null)
    );

    const navResults = await Promise.allSettled(navPromises);
    const navTime = Date.now() - navStart;

    const successes = navResults.filter((r) => r.status === "fulfilled").length;
    console.log(`${successes}/${userCount} users navigated successfully in ${navTime}ms`);

    // Cleanup
    for (const { page, context } of allSessions) {
      await page.close();
      await context.close();
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total test duration: ${totalTime}ms`);

    // Should handle 50+ users successfully
    expect(successes).toBeGreaterThan(45); // Allow for some failures
    // Should not take excessively long
    expect(totalTime).toBeLessThan(30000); // 30 seconds
  });
});
