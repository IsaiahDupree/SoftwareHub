// e2e/license-activation.spec.ts
// E2E test for license activation flow
// Test IDs: SH-E2E-005 through SH-E2E-008

import { test, expect } from "@playwright/test";

test.describe("License Activation Flow - sh-087", () => {
  test("SH-E2E-005: Activation API should require license_key and device_id", async ({ request }) => {
    // Call activate with missing fields
    const response = await request.post("/api/licenses/activate", {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("SH-E2E-006: Activation API should return 404 for invalid key", async ({ request }) => {
    const response = await request.post("/api/licenses/activate", {
      data: {
        license_key: "XXXX-XXXX-XXXX-XXXX",
        device_id: "test-device-e2e",
      },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Invalid license key");
  });

  test("SH-E2E-007: Validation API should reject invalid token", async ({ request }) => {
    const response = await request.post("/api/licenses/validate", {
      data: {
        activation_token: "not-a-valid-jwt-token",
        device_id: "test-device-e2e",
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.valid).toBe(false);
    expect(body.code).toBe("TOKEN_INVALID");
  });

  test("SH-E2E-008: Deactivation API should reject invalid token", async ({ request }) => {
    const response = await request.post("/api/licenses/deactivate", {
      data: {
        activation_token: "not-a-valid-jwt-token",
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid activation token");
  });

  test("Licenses page should redirect unauthenticated users", async ({ page }) => {
    await page.goto("/app/licenses");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Validation API should require both fields", async ({ request }) => {
    const response = await request.post("/api/licenses/validate", {
      data: {
        activation_token: "some-token",
        // missing device_id
      },
    });

    expect(response.status()).toBe(400);
  });

  test("Deactivation API should require token or license_id+device_id", async ({ request }) => {
    const response = await request.post("/api/licenses/deactivate", {
      data: {
        // missing both activation_token and license_id/device_id
      },
    });

    expect(response.status()).toBe(400);
  });
});
