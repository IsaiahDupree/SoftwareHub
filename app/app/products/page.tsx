import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";

export default async function MyProductsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = searchParams.filter || "all";

  // Get course entitlements
  const { data: courseEnts } = await supabase
    .from("entitlements")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const courseIds = (courseEnts ?? []).map((e) => e.course_id).filter(Boolean);

  let courses: Array<{ id: string; title: string; slug: string; description: string | null }> = [];
  if (courseIds.length > 0 && (filter === "all" || filter === "courses")) {
    const { data } = await supabase
      .from("courses")
      .select("id, title, slug, description")
      .in("id", courseIds);
    courses = data ?? [];
  }

  // Get package entitlements
  const { data: pkgEnts } = await supabase
    .from("package_entitlements")
    .select("package_id")
    .eq("user_id", user.id)
    .eq("has_access", true);

  const packageIds = (pkgEnts ?? []).map((e) => e.package_id);

  let packages: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon_url: string | null;
    type: string;
    status: string;
    current_version: string | null;
  }> = [];

  if (packageIds.length > 0) {
    let query = supabase
      .from("packages")
      .select("id, name, slug, description, icon_url, type, status, current_version")
      .in("id", packageIds)
      .eq("is_published", true);

    if (filter === "local_agents") {
      query = query.eq("type", "LOCAL_AGENT");
    } else if (filter === "cloud_apps") {
      query = query.eq("type", "CLOUD_APP");
    }

    if (filter !== "courses") {
      const { data } = await query;
      packages = data ?? [];
    }
  }

  const filters = [
    { label: "All", value: "all" },
    { label: "Courses", value: "courses" },
    { label: "Local Agents", value: "local_agents" },
    { label: "Cloud Apps", value: "cloud_apps" },
  ];

  const totalProducts = (filter === "all" || filter === "courses" ? courses.length : 0) +
    (filter === "all" || filter !== "courses" ? packages.length : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Products"
        description="All your purchased courses and software"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/app/products${f.value !== "all" ? `?filter=${f.value}` : ""}`}>
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      {totalProducts === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Browse our catalog to find courses and software"
          action={
            <Button asChild>
              <Link href="/courses">Browse Catalog</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Courses */}
          {(filter === "all" || filter === "courses") &&
            courses.map((course) => (
              <ProductCard
                key={`course-${course.id}`}
                type="course"
                name={course.title}
                slug={course.slug}
                iconUrl={null}
                description={course.description}
              />
            ))}

          {/* Packages */}
          {(filter === "all" || filter !== "courses") &&
            packages.map((pkg) => (
              <ProductCard
                key={`pkg-${pkg.id}`}
                type={pkg.type as "LOCAL_AGENT" | "CLOUD_APP"}
                name={pkg.name}
                slug={pkg.slug}
                iconUrl={pkg.icon_url}
                description={pkg.description}
                status={pkg.status}
                version={pkg.current_version}
              />
            ))}
        </div>
      )}
    </div>
  );
}
