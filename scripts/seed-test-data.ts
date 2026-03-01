/**
 * Test Data Seeding Script
 *
 * Idempotent script to seed test data for development and testing.
 * Can be run multiple times without errors - uses upsert operations.
 *
 * Run with: npx ts-node scripts/seed-test-data.ts
 */

import { createClient } from "@supabase/supabase-js";

// Use local Supabase instance
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54821";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user accounts
const TEST_ACCOUNTS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@test.com",
    role: "admin",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "user1@test.com",
    role: "user",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "user2@test.com",
    role: "user",
  },
];

// Test courses
const TEST_COURSES = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    title: "Test Course 1",
    slug: "test-course-1",
    description: "A test course for development",
    status: "published",
    stripe_price_id: "price_test_001",
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    title: "Test Course 2",
    slug: "test-course-2",
    description: "Another test course",
    status: "draft",
    stripe_price_id: null,
  },
];

// Test packages (software products)
const TEST_PACKAGES = [
  {
    package_id: "p0000000-0000-0000-0000-000000000001",
    name: "Test Package Alpha",
    slug: "test-package-alpha",
    description: "Test software package",
    type: "LOCAL_AGENT",
    status: "operational",
    price_cents: 4900,
    is_published: true,
  },
  {
    package_id: "p0000000-0000-0000-0000-000000000002",
    name: "Test Package Beta",
    slug: "test-package-beta",
    description: "Another test package",
    type: "SAAS",
    status: "operational",
    price_cents: 9900,
    is_published: false,
  },
];

// Test licenses
const TEST_LICENSES = [
  {
    id: "l0000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000002",
    package_id: "p0000000-0000-0000-0000-000000000001",
    license_key: "TEST-AAAA-BBBB-CCCC-DDDD",
    type: "pro",
    status: "active",
  },
  {
    id: "l0000000-0000-0000-0000-000000000002",
    user_id: "00000000-0000-0000-0000-000000000003",
    package_id: "p0000000-0000-0000-0000-000000000002",
    license_key: "TEST-EEEE-FFFF-GGGG-HHHH",
    type: "personal",
    status: "active",
  },
];

// Test enrollments
const TEST_ENROLLMENTS = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000002",
    course_id: "c0000000-0000-0000-0000-000000000001",
    enrolled_at: new Date().toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    user_id: "00000000-0000-0000-0000-000000000003",
    course_id: "c0000000-0000-0000-0000-000000000001",
    enrolled_at: new Date().toISOString(),
  },
];

async function seedAccounts() {
  console.log("Seeding accounts...");

  for (const account of TEST_ACCOUNTS) {
    // Note: In local Supabase, users need to be created via Supabase Auth
    // This is a placeholder - in real usage, you'd use Supabase Admin API
    // For now, we'll create user profiles assuming auth users exist
    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: account.id,
          email: account.email,
          metadata: { role: account.role, is_test_account: true },
        },
        { onConflict: "user_id" }
      );

    if (error && !error.message.includes("does not exist")) {
      console.warn(`Warning seeding account ${account.email}:`, error.message);
    } else {
      console.log(`✓ Seeded account: ${account.email}`);
    }
  }
}

async function seedCourses() {
  console.log("\nSeeding courses...");

  for (const course of TEST_COURSES) {
    const { error } = await supabase
      .from("courses")
      .upsert(course, { onConflict: "id" });

    if (error) {
      console.warn(`Warning seeding course ${course.slug}:`, error.message);
    } else {
      console.log(`✓ Seeded course: ${course.title}`);
    }
  }
}

async function seedPackages() {
  console.log("\nSeeding packages...");

  for (const pkg of TEST_PACKAGES) {
    const { error } = await supabase
      .from("packages")
      .upsert(pkg, { onConflict: "package_id" });

    if (error) {
      console.warn(`Warning seeding package ${pkg.slug}:`, error.message);
    } else {
      console.log(`✓ Seeded package: ${pkg.name}`);
    }
  }
}

async function seedLicenses() {
  console.log("\nSeeding licenses...");

  for (const license of TEST_LICENSES) {
    const { error } = await supabase
      .from("licenses")
      .upsert(license, { onConflict: "id" });

    if (error) {
      console.warn(`Warning seeding license ${license.license_key}:`, error.message);
    } else {
      console.log(`✓ Seeded license: ${license.license_key}`);
    }
  }
}

async function seedEnrollments() {
  console.log("\nSeeding enrollments...");

  for (const enrollment of TEST_ENROLLMENTS) {
    const { error } = await supabase
      .from("enrollments")
      .upsert(enrollment, { onConflict: "id" });

    if (error) {
      console.warn(`Warning seeding enrollment:`, error.message);
    } else {
      console.log(`✓ Seeded enrollment for user ${enrollment.user_id}`);
    }
  }
}

async function cleanupTestData() {
  console.log("\n🧹 Cleaning up old test data...");

  // Delete in reverse order of dependencies
  await supabase.from("enrollments").delete().like("id", "e0000000-%");
  await supabase.from("licenses").delete().like("id", "l0000000-%");
  await supabase.from("packages").delete().like("package_id", "p0000000-%");
  await supabase.from("courses").delete().like("id", "c0000000-%");

  console.log("✓ Cleanup complete");
}

async function main() {
  console.log("🌱 Starting test data seeding...\n");
  console.log(`Target: ${SUPABASE_URL}\n`);

  try {
    // Optional: Uncomment to cleanup before seeding
    // await cleanupTestData();

    await seedAccounts();
    await seedCourses();
    await seedPackages();
    await seedLicenses();
    await seedEnrollments();

    console.log("\n✅ Test data seeding complete!");
    console.log("\nTest Accounts:");
    TEST_ACCOUNTS.forEach(account => {
      console.log(`  - ${account.email} (${account.role})`);
    });

  } catch (error) {
    console.error("\n❌ Error seeding test data:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

export { cleanupTestData, seedAccounts, seedCourses, seedPackages, seedLicenses, seedEnrollments };
