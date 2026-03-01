import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://softwarehub.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dynamic course pages - fetch from database
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: courses } = await supabase
      .from("courses")
      .select("slug, updated_at")
      .eq("published", true);

    coursePages = (courses || []).map((course) => ({
      url: `${BASE_URL}/courses/${course.slug}`,
      lastModified: new Date(course.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Silently handle DB errors during build
  }

  return [...staticPages, ...coursePages];
}
