/**
 * Bundle size tracking script
 * Run after build to check for size regressions
 */
const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "..", ".next");
const THRESHOLD_KB = 500; // Warn if any page exceeds this

function checkBundleSize() {
  const manifestPath = path.join(BUILD_DIR, "build-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.log("No build manifest found. Run 'npm run build' first.");
    process.exit(0);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const pages = Object.keys(manifest.pages);
  let hasWarning = false;

  console.log("Bundle Size Report");
  console.log("==================");

  pages.forEach((page) => {
    const files = manifest.pages[page];
    let totalSize = 0;

    files.forEach((file) => {
      const filePath = path.join(BUILD_DIR, file);
      if (fs.existsSync(filePath)) {
        totalSize += fs.statSync(filePath).size;
      }
    });

    const sizeKB = Math.round(totalSize / 1024);
    const status = sizeKB > THRESHOLD_KB ? "WARNING" : "OK";
    if (sizeKB > THRESHOLD_KB) hasWarning = true;
    console.log(`${status} ${page}: ${sizeKB}KB (${files.length} files)`);
  });

  if (hasWarning) {
    console.log("\nWARNING: Some pages exceed the size threshold. Consider code splitting.");
  }
}

checkBundleSize();
