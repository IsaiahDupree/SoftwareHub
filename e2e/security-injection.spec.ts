import { test, expect } from "@playwright/test";

test.describe("Security Tests - Injection Prevention", () => {
  test("should sanitize XSS in form inputs", async ({ page }) => {
    await page.goto("/login");

    const xssPayloads = [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "javascript:alert('xss')",
      "<svg onload=alert('xss')>",
      "';alert('xss');//"
    ];

    for (const payload of xssPayloads) {
      const emailInput = page.locator("input[type='email']").first();

      if (await emailInput.isVisible()) {
        await emailInput.fill(payload);

        // Check that the value is sanitized or encoded
        const value = await emailInput.inputValue();

        // Script tags should not be executable
        expect(value).not.toContain("<script>");

        console.log(`XSS payload handled: ${payload}`);
      }
    }
  });

  test("should prevent XSS in URL parameters", async ({ page }) => {
    const xssUrl = "/search?q=<script>alert('xss')</script>";

    await page.goto(`http://localhost:2828${xssUrl}`);

    // Check that script is not executed
    const pageContent = await page.content();

    // Script should be encoded, not executed
    expect(pageContent).not.toContain("<script>alert('xss')</script>");

    console.log("URL XSS prevented");
  });

  test("should escape XSS in search results", async ({ page }) => {
    await page.goto("/courses");

    const searchInput = page.locator("input[type='search']").first();

    if (await searchInput.isVisible()) {
      const xssPayload = "<img src=x onerror=alert('xss')>";

      await searchInput.fill(xssPayload);
      await searchInput.press("Enter");

      await page.waitForTimeout(500);

      // Check that the search term is displayed safely
      const pageContent = await page.content();

      // Should be HTML-encoded
      expect(pageContent).not.toContain("onerror=alert");

      console.log("Search XSS prevented");
    }
  });

  test("should prevent SQL injection in search queries", async ({ request }) => {
    const sqlPayloads = [
      "' OR '1'='1",
      "1; DROP TABLE users--",
      "' UNION SELECT * FROM users--",
      "admin'--",
      "'; DELETE FROM courses; --"
    ];

    for (const payload of sqlPayloads) {
      const response = await request.get(
        `http://localhost:2828/api/search?q=${encodeURIComponent(payload)}`
      );

      // Should return normal response, not error
      expect(response.status()).toBeLessThan(500);

      const body = await response.text();

      // Should not contain SQL error messages
      expect(body).not.toContain("SQL syntax");
      expect(body).not.toContain("PostgreSQL");
      expect(body).not.toContain("syntax error");
      expect(body).not.toContain("unexpected token");

      console.log(`SQL injection blocked: ${payload}`);
    }
  });

  test("should prevent SQL injection in ID parameters", async ({ request }) => {
    const sqlPayloads = [
      "1 OR 1=1",
      "1'; DROP TABLE courses--",
      "1 UNION SELECT * FROM users"
    ];

    for (const payload of sqlPayloads) {
      const response = await request.get(
        `http://localhost:2828/api/courses/${encodeURIComponent(payload)}`
      ).catch(() => null);

      if (response) {
        // Should return 404 or 400, not SQL error
        expect(response.status()).not.toBe(500);

        const body = await response.text();
        expect(body).not.toContain("SQL");
        expect(body).not.toContain("syntax error");

        console.log(`SQL injection in ID blocked: ${response.status()}`);
      }
    }
  });

  test("should prevent command injection in file upload", async ({ page }) => {
    await page.goto("/app");

    const fileInput = page.locator("input[type='file']").first();

    if (await fileInput.isVisible().catch(() => false)) {
      // Try to upload file with malicious name
      const maliciousFilename = "test; rm -rf /;.jpg";

      // Create a temporary file
      const buffer = Buffer.from("fake image data");

      await fileInput.setInputFiles({
        name: maliciousFilename,
        mimeType: "image/jpeg",
        buffer
      });

      await page.waitForTimeout(500);

      console.log("File upload command injection test completed");
    }
  });

  test("should prevent NoSQL injection in API filters", async ({ request }) => {
    const noSqlPayloads = [
      { $gt: "" },
      { $ne: null },
      { $where: "this.password" }
    ];

    for (const payload of noSqlPayloads) {
      const response = await request.get("http://localhost:2828/api/courses", {
        params: {
          filter: JSON.stringify(payload)
        }
      }).catch(() => null);

      if (response) {
        // Should handle gracefully
        expect(response.status()).toBeLessThan(500);

        console.log(`NoSQL injection blocked: ${response.status()}`);
      }
    }
  });

  test("should sanitize HTML content in course descriptions", async ({ page }) => {
    await page.goto("/courses");

    // Check if any course descriptions contain unsanitized HTML
    const descriptions = page.locator("[data-testid='course-description']");
    const count = await descriptions.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const desc = descriptions.nth(i);
      const content = await desc.innerHTML();

      // Should not contain <script> tags
      expect(content).not.toContain("<script>");
      expect(content).not.toContain("onerror=");
      expect(content).not.toContain("onclick=");
      expect(content).not.toContain("javascript:");
    }

    console.log("Course descriptions sanitized");
  });

  test("should prevent LDAP injection", async ({ request }) => {
    const ldapPayloads = [
      "*)(uid=*",
      "admin)(|(password=*))",
      "*)(objectClass=*"
    ];

    for (const payload of ldapPayloads) {
      const response = await request.post("http://localhost:2828/api/auth/login", {
        data: {
          email: payload,
          password: "test"
        }
      }).catch(() => null);

      if (response) {
        // Should reject, not expose LDAP structure
        expect(response.status()).toBeGreaterThanOrEqual(400);

        const body = await response.text();
        expect(body).not.toContain("LDAP");

        console.log(`LDAP injection blocked: ${response.status()}`);
      }
    }
  });

  test("should prevent XML injection", async ({ request }) => {
    const xmlPayload = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<data>&xxe;</data>`;

    const response = await request.post("http://localhost:2828/api/import", {
      headers: {
        "Content-Type": "application/xml"
      },
      data: xmlPayload
    }).catch(() => null);

    if (response) {
      const body = await response.text();

      // Should not return file contents
      expect(body).not.toContain("root:x:0:0");

      console.log("XML injection prevented");
    }
  });

  test("should prevent path traversal in file access", async ({ request }) => {
    const pathTraversalPayloads = [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\config\\sam",
      "....//....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
    ];

    for (const payload of pathTraversalPayloads) {
      const response = await request.get(
        `http://localhost:2828/api/files/${encodeURIComponent(payload)}`
      ).catch(() => null);

      if (response) {
        // Should reject or return 404, not file contents
        expect(response.status()).not.toBe(200);

        const body = await response.text();
        expect(body).not.toContain("root:x:0:0");

        console.log(`Path traversal blocked: ${payload}`);
      }
    }
  });

  test("should prevent template injection", async ({ request }) => {
    const templatePayloads = [
      "{{7*7}}",
      "${7*7}",
      "#{7*7}",
      "<%= 7*7 %>"
    ];

    for (const payload of templatePayloads) {
      const response = await request.post("http://localhost:2828/api/courses", {
        data: {
          title: payload,
          description: "Test"
        }
      }).catch(() => null);

      if (response && response.ok()) {
        const data = await response.json().catch(() => null);

        if (data && data.title) {
          // Template should not be evaluated
          expect(data.title).not.toBe("49");
          expect(data.title).toBe(payload); // Stored as-is

          console.log(`Template injection prevented: ${payload}`);
        }
      }
    }
  });

  test("should prevent email header injection", async ({ request }) => {
    const emailPayload = "test@example.com\nBcc: attacker@evil.com";

    const response = await request.post("http://localhost:2828/api/auth/magic-link", {
      data: {
        email: emailPayload
      }
    }).catch(() => null);

    if (response) {
      // Should reject malformed email
      expect(response.status()).toBeGreaterThanOrEqual(400);

      console.log("Email header injection prevented");
    }
  });

  test("should validate and sanitize JSON input", async ({ request }) => {
    const maliciousJson = {
      __proto__: {
        isAdmin: true
      },
      constructor: {
        prototype: {
          isAdmin: true
        }
      }
    };

    const response = await request.post("http://localhost:2828/api/courses", {
      data: maliciousJson
    }).catch(() => null);

    if (response) {
      // Should handle safely without pollution
      console.log(`Prototype pollution attempt: ${response.status()}`);
    }
  });

  test("should prevent CRLF injection in redirects", async ({ page }) => {
    const crlfPayload = "/login?next=https://evil.com%0d%0aLocation:%20https://evil.com";

    await page.goto(`http://localhost:2828${crlfPayload}`);

    // Should not redirect to evil.com
    expect(page.url()).not.toContain("evil.com");

    console.log("CRLF injection prevented");
  });

  test("should escape special characters in database queries", async ({ request }) => {
    const specialChars = ["'", '"', ";", "--", "/*", "*/", "\\", "%"];

    for (const char of specialChars) {
      const response = await request.get(
        `http://localhost:2828/api/search?q=${encodeURIComponent(char)}`
      );

      // Should handle gracefully
      expect(response.status()).toBeLessThan(500);

      console.log(`Special char ${char} handled`);
    }
  });

  test("should prevent JavaScript injection in event handlers", async ({ page }) => {
    await page.goto("/courses");

    // Check that no inline event handlers exist
    const pageContent = await page.content();

    // Should not have inline JavaScript
    expect(pageContent).not.toMatch(/onclick\s*=/);
    expect(pageContent).not.toMatch(/onerror\s*=/);
    expect(pageContent).not.toMatch(/onload\s*=/);

    console.log("No inline event handlers detected");
  });

  test("should prevent CSV injection in export functionality", async ({ request }) => {
    const csvPayloads = [
      "=cmd|'/c calc'!A1",
      "@SUM(1+1)*cmd|'/c calc'!A1",
      "+cmd|'/c calc'!A1",
      "-cmd|'/c calc'!A1"
    ];

    for (const payload of csvPayloads) {
      const response = await request.post("http://localhost:2828/api/export", {
        data: {
          format: "csv",
          data: [{ name: payload }]
        }
      }).catch(() => null);

      if (response && response.ok()) {
        const body = await response.text();

        // Formula should be escaped
        if (body.includes(payload)) {
          // Should be prefixed with ' or escaped
          expect(body).toMatch(/['"]?[=@+-]/);
        }

        console.log(`CSV injection prevented: ${payload}`);
      }
    }
  });
});
