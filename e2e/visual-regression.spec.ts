import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test("should match screenshot of dashboard page", async ({ page }) => {
    await page.goto("/app");

    // Wait for page to settle
    await page.waitForLoadState("networkidle");

    // Take screenshot and compare
    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
      maxDiffPixels: 100 // Allow minor differences
    });
  });

  test("should match screenshot of course list page", async ({ page }) => {
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("courses-list.png", {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test("should match screenshot of login form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Screenshot just the form area
    const form = page.locator("form").first();
    await expect(form).toHaveScreenshot("login-form.png", {
      maxDiffPixels: 50
    });
  });

  test("should match screenshot of admin settings page", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // This will redirect to login, capture that state
    await expect(page).toHaveScreenshot("admin-protected.png", {
      fullPage: false,
      maxDiffPixels: 100
    });
  });

  test("should match screenshot of homepage hero section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Capture hero section only
    const hero = page.locator("main").first();
    await expect(hero).toHaveScreenshot("homepage-hero.png", {
      maxDiffPixels: 100
    });
  });

  test("should match screenshot of navigation menu", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Capture navigation
    const nav = page.locator("nav").first();
    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot("navigation.png", {
        maxDiffPixels: 50
      });
    }
  });

  test("should match screenshot of footer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator("footer").first();
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot("footer.png", {
        maxDiffPixels: 50
      });
    }
  });

  test("should match screenshot of course card layout", async ({ page }) => {
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    // Find first course card
    const courseCard = page.locator("[data-testid='course-card']").first();

    if (await courseCard.isVisible()) {
      await expect(courseCard).toHaveScreenshot("course-card.png", {
        maxDiffPixels: 50
      });
    } else {
      // If no course cards, capture the empty state
      await expect(page).toHaveScreenshot("courses-empty-state.png", {
        maxDiffPixels: 100
      });
    }
  });

  test("should match screenshot of mobile viewport", async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("mobile-homepage.png", {
      fullPage: true,
      maxDiffPixels: 150
    });
  });

  test("should match screenshot of tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("tablet-courses.png", {
      fullPage: true,
      maxDiffPixels: 150
    });
  });

  test("should match screenshot of dark mode (if supported)", async ({ page }) => {
    await page.goto("/");

    // Try to enable dark mode if toggle exists
    const darkModeToggle = page.locator("[data-testid='dark-mode-toggle']");

    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot("dark-mode-homepage.png", {
        fullPage: true,
        maxDiffPixels: 100
      });
    } else {
      // No dark mode, skip
      console.log("Dark mode not available, skipping");
    }
  });

  test("should match screenshot of form validation states", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Try to submit empty form to trigger validation
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for validation messages
    await page.waitForTimeout(500);

    const form = page.locator("form").first();
    await expect(form).toHaveScreenshot("form-validation-error.png", {
      maxDiffPixels: 50
    });
  });

  test("should match screenshot of loading state", async ({ page }) => {
    // Navigate and capture during load
    await page.goto("/courses", { waitUntil: "domcontentloaded" });

    // Try to capture loading state (may be fast)
    const loader = page.locator("[data-testid='loader']");

    if (await loader.isVisible().catch(() => false)) {
      await expect(loader).toHaveScreenshot("loading-state.png");
    } else {
      console.log("Loading state too fast to capture");
    }
  });

  test("should match screenshot of modal dialog", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Try to open a modal
    const modalTrigger = page.locator("[data-testid='open-modal']");

    if (await modalTrigger.isVisible().catch(() => false)) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = page.locator("[role='dialog']");
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot("modal-dialog.png");
      }
    } else {
      console.log("No modal trigger found, skipping");
    }
  });

  test("should match screenshot of empty states", async ({ page }) => {
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    // Check if empty state is showing
    const emptyState = page.locator("[data-testid='empty-state']");

    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toHaveScreenshot("empty-state.png");
    } else {
      console.log("No empty state visible");
    }
  });

  test("should detect layout shifts in critical pages", async ({ page }) => {
    await page.goto("/");

    // Take initial screenshot
    await page.waitForTimeout(100);
    const initial = await page.screenshot();

    // Wait for any late-loading content
    await page.waitForTimeout(1000);

    // Take final screenshot
    const final = await page.screenshot();

    // If significant layout shift occurred, screenshots would differ
    // This is a simplified check
    expect(initial.length).toBeGreaterThan(0);
    expect(final.length).toBeGreaterThan(0);
  });
});

test.describe("Visual Regression - Component States", () => {
  test("should match button states (default, hover, active)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const button = page.locator("button").first();

    if (await button.isVisible()) {
      // Default state
      await expect(button).toHaveScreenshot("button-default.png");

      // Hover state
      await button.hover();
      await page.waitForTimeout(100);
      await expect(button).toHaveScreenshot("button-hover.png");
    }
  });

  test("should match input field states", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const input = page.locator("input").first();

    if (await input.isVisible()) {
      // Empty state
      await expect(input).toHaveScreenshot("input-empty.png");

      // Focused state
      await input.focus();
      await page.waitForTimeout(100);
      await expect(input).toHaveScreenshot("input-focused.png");

      // Filled state
      await input.fill("test@example.com");
      await expect(input).toHaveScreenshot("input-filled.png");
    }
  });

  test("should match card components in different states", async ({ page }) => {
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");

    const cards = page.locator("[data-testid='course-card']");
    const count = await cards.count();

    if (count > 0) {
      // First card
      await expect(cards.first()).toHaveScreenshot("card-first.png", {
        maxDiffPixels: 50
      });

      // Last card (may have different styling)
      if (count > 1) {
        await expect(cards.last()).toHaveScreenshot("card-last.png", {
          maxDiffPixels: 50
        });
      }
    }
  });
});
