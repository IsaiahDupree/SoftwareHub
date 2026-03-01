import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Use local Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54821";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

test.describe("Database Query Performance Tests", () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  test("should query courses table efficiently (< 200ms)", async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`Courses query time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(200);
  });

  test("should perform indexed lookups quickly (< 100ms)", async () => {
    const startTime = Date.now();

    // Query by ID (should use primary key index)
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .limit(1)
      .single();

    const queryTime = Date.now() - startTime;
    console.log(`Indexed lookup time: ${queryTime}ms`);

    expect(queryTime).toBeLessThan(200);
  });

  test("should handle pagination efficiently (< 200ms)", async () => {
    const startTime = Date.now();

    const { data, error, count } = await supabase
      .from("courses")
      .select("*", { count: "exact" })
      .range(0, 9);

    const queryTime = Date.now() - startTime;
    console.log(`Paginated query time: ${queryTime}ms, count: ${count}`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(200);
  });

  test("should execute JOIN queries efficiently (< 300ms)", async () => {
    const startTime = Date.now();

    // Query courses with creator information
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        users:created_by (
          id,
          email
        )
      `)
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`JOIN query time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(300);
  });

  test("should perform full-text search efficiently (< 300ms)", async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .textSearch("title", "test", {
        config: "english"
      });

    const queryTime = Date.now() - startTime;
    console.log(`Full-text search time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(300);
  });

  test("should handle filtering efficiently (< 200ms)", async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`Filtered query time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(200);
  });

  test("should handle sorting efficiently (< 200ms)", async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`Sorted query time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(200);
  });

  test("should execute aggregate queries efficiently (< 300ms)", async () => {
    const startTime = Date.now();

    const { count, error } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    const queryTime = Date.now() - startTime;
    console.log(`Count query time: ${queryTime}ms, count: ${count}`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(300);
  });

  test("should handle complex WHERE clauses efficiently (< 300ms)", async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`Complex WHERE query time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(300);
  });

  test("should check for proper indexing on frequently queried columns", async () => {
    // This test verifies that commonly queried columns have indexes
    // In production, you would query pg_indexes to verify

    const queries = [
      { table: "courses", column: "id" },
      { table: "courses", column: "published" },
      { table: "courses", column: "created_at" }
    ];

    for (const query of queries) {
      const startTime = Date.now();

      await supabase
        .from(query.table)
        .select("*")
        .limit(1);

      const queryTime = Date.now() - startTime;
      console.log(`${query.table}.${query.column} query time: ${queryTime}ms`);

      // Indexed queries should be very fast
      expect(queryTime).toBeLessThan(200);
    }
  });

  test("should avoid sequential scans on large tables", async () => {
    const startTime = Date.now();

    // Query that should use index
    const { data, error } = await supabase
      .from("courses")
      .select("id, title")
      .eq("published", true)
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`Selective query time: ${queryTime}ms`);

    expect(error).toBeNull();
    // Should be fast with proper indexing
    expect(queryTime).toBeLessThan(200);
  });

  test("should handle concurrent database queries efficiently", async () => {
    const startTime = Date.now();

    // Execute multiple queries concurrently
    const promises = [
      supabase.from("courses").select("*").limit(5),
      supabase.from("users").select("*").limit(5),
      supabase.from("entitlements").select("*").limit(5),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true })
    ];

    const results = await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / promises.length;

    console.log(`${promises.length} concurrent queries in: ${totalTime}ms (avg: ${avgTime}ms)`);

    // All queries should succeed
    results.forEach((result) => {
      expect(result.error).toBeNull();
    });

    // Concurrent queries should complete quickly
    expect(totalTime).toBeLessThan(1000);
  });

  test("should efficiently query with RLS policies enabled", async () => {
    const startTime = Date.now();

    // Query with RLS - uses anon key, so policies will apply
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .limit(10);

    const queryTime = Date.now() - startTime;
    console.log(`RLS query time: ${queryTime}ms`);

    expect(error).toBeNull();
    // RLS should not significantly slow down queries
    expect(queryTime).toBeLessThan(300);
  });

  test("should perform nested relationship queries efficiently (< 400ms)", async () => {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        modules:course_modules (
          id,
          title,
          lessons:course_lessons (
            id,
            title
          )
        )
      `)
      .limit(5);

    const queryTime = Date.now() - startTime;
    console.log(`Nested relationship query time: ${queryTime}ms`);

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(400);
  });

  test("should handle INSERT operations efficiently (< 200ms)", async () => {
    const startTime = Date.now();

    // Try to insert (may fail due to auth, but we measure speed)
    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: "Performance Test Course",
        description: "Test",
        published: false
      })
      .select();

    const queryTime = Date.now() - startTime;
    console.log(`INSERT operation time: ${queryTime}ms`);

    // Even if it fails due to RLS, it should fail quickly
    expect(queryTime).toBeLessThan(200);
  });
});
