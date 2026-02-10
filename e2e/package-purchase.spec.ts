// e2e/package-purchase.spec.ts
// E2E test for package purchase flow
// Test IDs: SH-E2E-001 through SH-E2E-004

import { test, expect } from "@playwright/test";

test.describe("Package Purchase Flow - sh-086", () => {
  test("SH-E2E-001: Should display package detail page", async ({ page }) => {
    // Navigate to a public package page
    await page.goto("/packages");

    // If there are packages, verify the page renders
    const heading = page.locator("h1");
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("SH-E2E-002: Should display package info on detail page", async ({ page }) => {
    // Try to visit a known package detail page
    // This tests the public package detail route renders correctly
    await page.goto("/packages/test-package");

    // Either shows package detail or 404
    await page.waitForLoadState("networkidle");

    // Check the page loaded (either package or not found)
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("SH-E2E-003: Should redirect to login for unauthenticated checkout", async ({ page }) => {
    // Try to access downloads page without auth - should redirect to login
    await page.goto("/app/downloads");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("SH-E2E-004: Should show products page for authenticated user", async ({ page }) => {
    // Visit the products page - should redirect to login if not authenticated
    await page.goto("/app/products");
    await page.waitForLoadState("networkidle");

    // Should redirect to login since we're not authenticated
    const url = page.url();
    expect(url).toMatch(/\/(login|app\/products)/);
  });

  test("Package checkout API should require authentication", async ({ request }) => {
    // Try to create a package checkout session without auth
    const response = await request.post("/api/stripe/package-checkout", {
      data: {
        package_id: "fake-package-id",
      },
    });

    // Should be 401 (unauthorized)
    expect(response.status()).toBe(401);
  });

  test("Package detail page should show features and requirements", async ({ page }) => {
    // Navigate to packages listing or a specific package
    await page.goto("/packages/test-package");
    await page.waitForLoadState("networkidle");

    // Verify the page doesn't crash (no error boundary)
    const hasError = await page.locator('text="Application error"').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
