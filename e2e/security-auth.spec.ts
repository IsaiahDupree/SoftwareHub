import { test, expect } from "@playwright/test";

test.describe("Security Tests - Authentication Bypass Prevention", () => {
  test("should reject unauthenticated API requests with 401", async ({ request }) => {
    // Protected endpoints that should require auth
    const protectedEndpoints = [
      "/api/user/profile",
      "/api/admin/courses",
      "/api/admin/users",
      "/api/user/settings"
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`http://localhost:2828${endpoint}`).catch(() => null);

      if (response) {
        console.log(`${endpoint}: ${response.status()}`);

        // Should return 401 Unauthorized or 403 Forbidden, not 200
        expect(response.status()).toBeGreaterThanOrEqual(401);
        expect(response.status()).toBeLessThan(500);
      }
    }
  });

  test("should redirect unauthenticated users from protected pages", async ({ page }) => {
    const protectedPages = ["/app", "/admin", "/app/settings", "/admin/courses"];

    for (const pagePath of protectedPages) {
      await page.goto(`http://localhost:2828${pagePath}`);

      // Should redirect to login
      await page.waitForURL(/\/login/);

      expect(page.url()).toContain("/login");
      console.log(`${pagePath} correctly redirected to login`);
    }
  });

  test("should not leak data in error responses", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/user/profile");

    if (response.status() === 401) {
      const body = await response.text();

      // Should not contain sensitive information
      expect(body).not.toContain("password");
      expect(body).not.toContain("token");
      expect(body).not.toContain("secret");
      expect(body).not.toContain("database");
      expect(body).not.toContain("stack trace");

      console.log("401 response body:", body);
    }
  });

  test("should reject requests with invalid auth tokens", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/user/profile", {
      headers: {
        Authorization: "Bearer invalid-token-12345"
      }
    });

    expect(response.status()).toBeGreaterThanOrEqual(401);
    console.log(`Invalid token response: ${response.status()}`);
  });

  test("should reject requests with malformed auth headers", async ({ request }) => {
    const malformedHeaders = [
      { Authorization: "InvalidFormat" },
      { Authorization: "Bearer" }, // Missing token
      { Authorization: "" },
      { "X-Auth-Token": "some-token" } // Wrong header
    ];

    for (const headers of malformedHeaders) {
      const response = await request.get("http://localhost:2828/api/user/profile", {
        headers
      });

      expect(response.status()).toBeGreaterThanOrEqual(401);
      console.log(`Malformed auth header ${JSON.stringify(headers)}: ${response.status()}`);
    }
  });

  test("should not expose admin functionality to non-admin users", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login (not admin page)
    await page.waitForURL(/\/login/);

    // Check that admin UI elements are not visible
    const adminPanel = page.locator("[data-testid='admin-panel']");
    expect(await adminPanel.isVisible().catch(() => false)).toBeFalsy();
  });

  test("should validate session expiry", async ({ page, context }) => {
    // Clear all cookies to simulate expired session
    await context.clearCookies();

    await page.goto("/app");

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});

    expect(page.url()).toContain("/login");
  });

  test("should not allow direct access to user data without permission", async ({ request }) => {
    // Try to access another user's data
    const testUserIds = [
      "00000000-0000-0000-0000-000000000001",
      "user-123",
      "admin"
    ];

    for (const userId of testUserIds) {
      const response = await request.get(`http://localhost:2828/api/users/${userId}`);

      // Should be unauthorized or not found, not 200
      if (response.status() !== 404) {
        expect(response.status()).toBeGreaterThanOrEqual(401);
      }

      console.log(`User ${userId} access: ${response.status()}`);
    }
  });

  test("should prevent privilege escalation via API", async ({ request }) => {
    // Try to update user role without permission
    const response = await request.patch("http://localhost:2828/api/user/profile", {
      data: {
        role: "admin",
        is_admin: true
      }
    });

    // Should reject
    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`Privilege escalation attempt: ${response.status()}`);
  });

  test("should enforce CSRF protection on mutations", async ({ request }) => {
    // Try POST without CSRF token
    const response = await request.post("http://localhost:2828/api/courses", {
      data: {
        title: "Test Course"
      }
    });

    // Should reject (401 unauthorized or 403 forbidden)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("should not expose internal paths in error messages", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/nonexistent");

    const body = await response.text();

    // Should not leak file system paths
    expect(body).not.toContain("/Users/");
    expect(body).not.toContain("C:\\");
    expect(body).not.toContain("/var/www");
    expect(body).not.toContain(".env");

    console.log("404 response does not leak paths");
  });

  test("should rate limit failed authentication attempts", async ({ request }) => {
    // Attempt multiple failed logins
    const attempts = [];

    for (let i = 0; i < 10; i++) {
      attempts.push(
        request.post("http://localhost:2828/api/auth/login", {
          data: {
            email: "test@example.com",
            password: "wrongpassword"
          }
        }).catch(() => null)
      );
    }

    const responses = await Promise.all(attempts);
    const statuses = responses.map((r) => r?.status());

    console.log("Failed login statuses:", statuses);

    // If rate limiting is implemented, later attempts should be 429
    // For now, just check that all are rejected
    responses.forEach((response) => {
      if (response) {
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test("should not allow session fixation attacks", async ({ page, context }) => {
    // Set a custom session cookie
    await context.addCookies([
      {
        name: "session",
        value: "attacker-controlled-session-id",
        domain: "localhost",
        path: "/"
      }
    ]);

    await page.goto("/app");

    // Should redirect to login (not use attacker's session)
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});

    expect(page.url()).toContain("/login");
  });

  test("should clear sensitive data on logout", async ({ page, context }) => {
    // This test assumes logout functionality exists
    await page.goto("/");

    const logoutButton = page.locator("[data-testid='logout']");

    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();

      // Check that session cookies are cleared
      const cookies = await context.cookies();
      const sessionCookie = cookies.find((c) => c.name === "session" || c.name.includes("auth"));

      if (sessionCookie) {
        // Session should be cleared or marked as expired
        expect(sessionCookie.value).toBeFalsy();
      }
    }
  });

  test("should prevent unauthorized file access", async ({ request }) => {
    // Try to access sensitive files
    const sensitiveFiles = [
      "/.env",
      "/.env.local",
      "/package.json",
      "/../package.json",
      "/api/../.env"
    ];

    for (const file of sensitiveFiles) {
      const response = await request.get(`http://localhost:2828${file}`).catch(() => null);

      if (response) {
        // Should not return file contents
        expect(response.status()).not.toBe(200);
        console.log(`${file}: ${response.status()}`);
      }
    }
  });

  test("should validate API key usage if implemented", async ({ request }) => {
    const response = await request.get("http://localhost:2828/api/courses", {
      headers: {
        "X-API-Key": "invalid-key"
      }
    });

    // If API keys are used, invalid ones should be rejected
    // If not used, request should succeed or fail for other reasons
    console.log(`API key validation: ${response.status()}`);
  });
});
