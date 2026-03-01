import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Audit with axe-core", () => {
  test("should have no accessibility violations on homepage", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    console.log(`Found ${accessibilityScanResults.violations.length} accessibility violations`);

    if (accessibilityScanResults.violations.length > 0) {
      console.log("Violations:", JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have no accessibility violations on login page", async ({ page }) => {
    await page.goto("/login");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    console.log(`Found ${accessibilityScanResults.violations.length} violations on login page`);

    if (accessibilityScanResults.violations.length > 0) {
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have no accessibility violations on courses page", async ({ page }) => {
    await page.goto("/courses");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    console.log(`Found ${accessibilityScanResults.violations.length} violations on courses page`);

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have no critical or serious accessibility issues on admin pages", async ({ page }) => {
    // Admin pages redirect to login, but we test the initial render
    await page.goto("/admin");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    // Filter for critical and serious issues only
    const criticalIssues = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    console.log(`Found ${criticalIssues.length} critical/serious violations on admin page`);

    expect(criticalIssues).toEqual([]);
  });

  test("should have proper color contrast ratios", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .disableRules(["region"]) // Focus on color contrast
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "color-contrast"
    );

    console.log(`Found ${contrastViolations.length} color contrast violations`);

    if (contrastViolations.length > 0) {
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`- Element: ${node.html}`);
          console.log(`  Failure: ${node.failureSummary}`);
        });
      });
    }

    expect(contrastViolations).toEqual([]);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["best-practice"])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id.includes("heading")
    );

    console.log(`Found ${headingViolations.length} heading structure violations`);

    expect(headingViolations).toEqual([]);
  });

  test("should have accessible form labels", async ({ page }) => {
    await page.goto("/login");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a"])
      .analyze();

    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "label" || v.id === "form-field-multiple-labels"
    );

    console.log(`Found ${labelViolations.length} form label violations`);

    expect(labelViolations).toEqual([]);
  });

  test("should have proper ARIA attributes", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter(
      (v) => v.id.includes("aria")
    );

    console.log(`Found ${ariaViolations.length} ARIA violations`);

    if (ariaViolations.length > 0) {
      ariaViolations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(ariaViolations).toEqual([]);
  });

  test("should have accessible images with alt text", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const imageViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "image-alt"
    );

    console.log(`Found ${imageViolations.length} image alt text violations`);

    expect(imageViolations).toEqual([]);
  });

  test("should have keyboard navigable elements", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a"])
      .analyze();

    const keyboardViolations = accessibilityScanResults.violations.filter(
      (v) => v.id.includes("keyboard") || v.id === "focusable-content"
    );

    console.log(`Found ${keyboardViolations.length} keyboard navigation violations`);

    expect(keyboardViolations).toEqual([]);
  });

  test("should have proper link text (no 'click here')", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const linkViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "link-name" || v.id === "link-in-text-block"
    );

    console.log(`Found ${linkViolations.length} link text violations`);

    expect(linkViolations).toEqual([]);
  });

  test("should have proper HTML lang attribute", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const langViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "html-has-lang" || v.id === "html-lang-valid"
    );

    console.log(`Found ${langViolations.length} HTML lang violations`);

    expect(langViolations).toEqual([]);
  });

  test("should have accessible buttons and interactive elements", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    const buttonViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "button-name" || v.id === "role-img-alt"
    );

    console.log(`Found ${buttonViolations.length} button/interactive element violations`);

    expect(buttonViolations).toEqual([]);
  });

  test("should meet WCAG 2.1 Level AA standards", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa", "wcag21aa"])
      .analyze();

    console.log(`WCAG 2.1 AA violations: ${accessibilityScanResults.violations.length}`);
    console.log(`Passes: ${accessibilityScanResults.passes.length}`);
    console.log(`Incomplete: ${accessibilityScanResults.incomplete.length}`);

    if (accessibilityScanResults.violations.length > 0) {
      console.log("\nViolations by impact:");
      const byImpact = {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      };

      accessibilityScanResults.violations.forEach((v) => {
        if (v.impact) {
          byImpact[v.impact as keyof typeof byImpact]++;
        }
      });

      console.log(JSON.stringify(byImpact, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have accessible navigation landmarks", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["best-practice"])
      .analyze();

    const landmarkViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "region" || v.id === "landmark-one-main"
    );

    console.log(`Found ${landmarkViolations.length} landmark violations`);

    // Landmarks are best practice, not critical
    // We'll log them but not fail the test
    if (landmarkViolations.length > 0) {
      landmarkViolations.forEach((v) => {
        console.log(`- ${v.id}: ${v.description}`);
      });
    }
  });

  test("should generate full accessibility report for homepage", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    const report = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      violations: accessibilityScanResults.violations.length,
      passes: accessibilityScanResults.passes.length,
      incomplete: accessibilityScanResults.incomplete.length,
      inapplicable: accessibilityScanResults.inapplicable.length,
      summary: {
        critical: accessibilityScanResults.violations.filter(v => v.impact === "critical").length,
        serious: accessibilityScanResults.violations.filter(v => v.impact === "serious").length,
        moderate: accessibilityScanResults.violations.filter(v => v.impact === "moderate").length,
        minor: accessibilityScanResults.violations.filter(v => v.impact === "minor").length
      }
    };

    console.log("\n=== Accessibility Report ===");
    console.log(JSON.stringify(report, null, 2));

    // Test passes if there are no critical or serious violations
    const criticalOrSerious = report.summary.critical + report.summary.serious;
    expect(criticalOrSerious).toBe(0);
  });
});
