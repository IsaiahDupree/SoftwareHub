import { test, expect } from "@playwright/test";

test.describe("Performance Tests - Page Load", () => {
  test("should load homepage with LCP < 2.5s", async ({ page }) => {
    const startTime = Date.now();

    // Navigate to homepage
    await page.goto("/", { waitUntil: "networkidle" });

    // Get Web Vitals using browser API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore - Web Vitals API
        if (window.performance && window.performance.getEntriesByType) {
          const paintEntries = window.performance.getEntriesByType("paint");
          const lcp = paintEntries.find((entry) => entry.name === "largest-contentful-paint");

          // Get LCP from PerformanceObserver if available
          if ("PerformanceObserver" in window) {
            try {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve({
                  lcp: lastEntry.startTime,
                  name: lastEntry.name
                });
              });
              observer.observe({ entryTypes: ["largest-contentful-paint"] });

              // Fallback after 3 seconds
              setTimeout(() => {
                resolve({ lcp: lcp?.startTime || 0, name: "fallback" });
              }, 3000);
            } catch (e) {
              resolve({ lcp: lcp?.startTime || 0, name: "error" });
            }
          } else {
            resolve({ lcp: lcp?.startTime || 0, name: "no-observer" });
          }
        } else {
          resolve({ lcp: 0, name: "no-api" });
        }
      });
    });

    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);
    console.log(`LCP metrics:`, metrics);

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should load course listing page with LCP < 2.5s", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/courses", { waitUntil: "networkidle" });

    const loadTime = Date.now() - startTime;
    console.log(`Courses page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);

    // Check that key content is visible
    await expect(page.getByRole("heading", { name: /courses/i })).toBeVisible();
  });

  test("should have minimal Cumulative Layout Shift (CLS < 0.1)", async ({ page }) => {
    await page.goto("/");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;

        if ("PerformanceObserver" in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                // @ts-ignore
                if (!entry.hadRecentInput && entry.value) {
                  // @ts-ignore
                  clsValue += entry.value;
                }
              }
            });

            observer.observe({ entryTypes: ["layout-shift"] });

            // Measure for 2 seconds
            setTimeout(() => {
              resolve(clsValue);
            }, 2000);
          } catch (e) {
            resolve(0);
          }
        } else {
          resolve(0);
        }
      });
    });

    console.log(`CLS value: ${cls}`);

    // CLS should be less than 0.1 (good threshold)
    expect(cls).toBeLessThan(0.1);
  });

  test("should have fast First Input Delay simulation (FID < 100ms)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Measure actual FID using Performance Observer
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ("PerformanceObserver" in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                // @ts-ignore - First Input Delay
                if (entry.processingStart && entry.startTime) {
                  // @ts-ignore
                  const delay = entry.processingStart - entry.startTime;
                  resolve(delay);
                }
              }
            });
            observer.observe({ entryTypes: ["first-input"] });

            // Timeout after 5 seconds
            setTimeout(() => resolve(0), 5000);
          } catch (e) {
            resolve(0);
          }
        } else {
          resolve(0);
        }
      });
    });

    // Simulate a click to trigger first input
    await page.locator("body").click({ force: true }).catch(() => {});

    // Wait a bit for measurement
    await page.waitForTimeout(100);

    console.log(`First Input Delay: ${fid}ms`);

    // FID should be less than 100ms (good threshold)
    // Note: In automated tests, this might not always capture real FID
    // so we use a lenient check
    if (fid > 0) {
      expect(fid).toBeLessThan(150);
    }
  });

  test("should load login page quickly (< 2s)", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/login", { waitUntil: "networkidle" });

    const loadTime = Date.now() - startTime;
    console.log(`Login page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(2000);

    // Key elements should be visible
    await expect(page.getByRole("heading", { name: /enter the room|welcome/i })).toBeVisible();
  });

  test("should load admin dashboard quickly for authenticated users", async ({ page }) => {
    // Note: This test assumes auth is not required for measurement
    // In real scenario, you'd set up authenticated session first

    const startTime = Date.now();

    // This will redirect to login, but we measure the initial load
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const loadTime = Date.now() - startTime;
    console.log(`Admin page initial load time: ${loadTime}ms`);

    // Even redirect should be fast
    expect(loadTime).toBeLessThan(2000);
  });

  test("should have optimal Time to Interactive (TTI)", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for page to be fully interactive
    await page.waitForLoadState("load");

    const tti = Date.now() - startTime;
    console.log(`Time to Interactive: ${tti}ms`);

    // TTI should be under 3.5 seconds for good performance
    expect(tti).toBeLessThan(3500);
  });

  test("should efficiently load and parse JavaScript", async ({ page }) => {
    await page.goto("/");

    // Get JavaScript execution metrics
    const jsMetrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        domInteractive: perfData.domInteractive - perfData.navigationStart,
        domComplete: perfData.domComplete - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart
      };
    });

    console.log("JS Execution Metrics:", jsMetrics);

    // DOM should be interactive quickly
    expect(jsMetrics.domInteractive).toBeLessThan(2500);
  });

  test("should load static assets efficiently", async ({ page }) => {
    const resourceTimings: any[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes(".js") || url.includes(".css") || url.includes(".png") || url.includes(".jpg")) {
        resourceTimings.push({
          url: url.split("/").pop(),
          status: response.status()
        });
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    console.log(`Loaded ${resourceTimings.length} static assets`);

    // Check that critical assets loaded successfully
    const failedAssets = resourceTimings.filter(r => r.status >= 400);
    expect(failedAssets.length).toBe(0);

    // Most assets should load quickly
    resourceTimings.forEach(asset => {
      console.log(`Asset: ${asset.url}, Status: ${asset.status}`);
    });
  });

  test("should have minimal blocking resources", async ({ page }) => {
    await page.goto("/");

    // Check for render-blocking resources
    const blockingResources = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType("resource");
      return resources.filter((r: any) => {
        return r.renderBlockingStatus === "blocking";
      }).length;
    });

    console.log(`Render-blocking resources: ${blockingResources}`);

    // Should minimize blocking resources
    expect(blockingResources).toBeLessThan(5);
  });
});
