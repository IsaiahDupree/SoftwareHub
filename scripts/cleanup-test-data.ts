/**
 * Cleanup Test Data Script
 *
 * Removes all test data seeded by seed-test-data.ts
 *
 * Run with: npx ts-node scripts/cleanup-test-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54821";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanup() {
  console.log("🧹 Cleaning up test data...\n");
  console.log(`Target: ${SUPABASE_URL}\n`);

  try {
    // Delete in reverse order of dependencies
    console.log("Deleting enrollments...");
    const { error: enrollmentError, count: enrollmentCount } = await supabase
      .from("enrollments")
      .delete({ count: "exact" })
      .like("id", "e0000000-%");

    if (enrollmentError) {
      console.warn("⚠️  Error deleting enrollments:", enrollmentError.message);
    } else {
      console.log(`✓ Deleted ${enrollmentCount || 0} test enrollments`);
    }

    console.log("Deleting licenses...");
    const { error: licenseError, count: licenseCount } = await supabase
      .from("licenses")
      .delete({ count: "exact" })
      .like("id", "l0000000-%");

    if (licenseError) {
      console.warn("⚠️  Error deleting licenses:", licenseError.message);
    } else {
      console.log(`✓ Deleted ${licenseCount || 0} test licenses`);
    }

    console.log("Deleting packages...");
    const { error: packageError, count: packageCount } = await supabase
      .from("packages")
      .delete({ count: "exact" })
      .like("package_id", "p0000000-%");

    if (packageError) {
      console.warn("⚠️  Error deleting packages:", packageError.message);
    } else {
      console.log(`✓ Deleted ${packageCount || 0} test packages`);
    }

    console.log("Deleting courses...");
    const { error: courseError, count: courseCount } = await supabase
      .from("courses")
      .delete({ count: "exact" })
      .like("id", "c0000000-%");

    if (courseError) {
      console.warn("⚠️  Error deleting courses:", courseError.message);
    } else {
      console.log(`✓ Deleted ${courseCount || 0} test courses`);
    }

    console.log("Deleting user profiles...");
    const { error: profileError, count: profileCount } = await supabase
      .from("user_profiles")
      .delete({ count: "exact" })
      .like("user_id", "00000000-0000-0000-0000-%");

    if (profileError) {
      console.warn("⚠️  Error deleting user profiles:", profileError.message);
    } else {
      console.log(`✓ Deleted ${profileCount || 0} test user profiles`);
    }

    console.log("\n✅ Cleanup complete!");

  } catch (error) {
    console.error("\n❌ Error cleaning up test data:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanup().then(() => process.exit(0));
}

export { cleanup };
