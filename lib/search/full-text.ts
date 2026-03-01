import { createClient } from "@/lib/supabase/client";

export interface SearchResult {
  id: string;
  type: "course" | "lesson" | "product";
  title: string;
  description: string;
  url: string;
  score: number;
}

export async function fullTextSearch(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const supabase = createClient();
  const results: SearchResult[] = [];

  // Search courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, slug")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .eq("published", true)
    .limit(limit);

  if (courses) {
    results.push(
      ...courses.map((c) => ({
        id: c.id,
        type: "course" as const,
        title: c.title,
        description: c.description || "",
        url: `/courses/${c.slug}`,
        score: c.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1,
      }))
    );
  }

  // Search lessons
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (lessons) {
    results.push(
      ...lessons.map((l) => ({
        id: l.id,
        type: "lesson" as const,
        title: l.title,
        description: l.description || "",
        url: `/app/courses`,
        score: l.title.toLowerCase().includes(query.toLowerCase()) ? 1.5 : 0.5,
      }))
    );
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
