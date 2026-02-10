import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Download,
  KeyRound,
  DollarSign,
  Users,
  Package,
  TrendingUp,
} from "lucide-react";
import { PackageRevenueTable } from "@/components/analytics/PackageRevenueTable";
import { ActiveUsersChart } from "@/components/analytics/ActiveUsersChart";

export default async function PackageDashboardPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/app");

  // Total downloads
  const { data: downloadData } = await supabaseAdmin
    .from("download_logs")
    .select("id", { count: "exact", head: true });
  const totalDownloads = downloadData ?? 0;

  // Downloads count via count
  const { count: downloadsCount } = await supabaseAdmin
    .from("download_logs")
    .select("id", { count: "exact", head: true });

  // Active licenses
  const { count: activeLicenses } = await supabaseAdmin
    .from("licenses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Total licenses
  const { count: totalLicenses } = await supabaseAdmin
    .from("licenses")
    .select("id", { count: "exact", head: true });

  // Active package users (users with active entitlements)
  const { count: activePackageUsers } = await supabaseAdmin
    .from("package_entitlements")
    .select("user_id", { count: "exact", head: true })
    .eq("has_access", true);

  // Published packages
  const { count: publishedPackages } = await supabaseAdmin
    .from("packages")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  // Revenue by package - get orders for package purchases
  const { data: packages } = await supabaseAdmin
    .from("packages")
    .select("id, name, slug, type, price_cents, is_published")
    .order("name");

  // Get entitlement counts per package
  const { data: entitlementCounts } = await supabaseAdmin
    .from("package_entitlements")
    .select("package_id")
    .eq("has_access", true);

  const entCountMap = new Map<string, number>();
  (entitlementCounts ?? []).forEach((e) => {
    entCountMap.set(e.package_id, (entCountMap.get(e.package_id) ?? 0) + 1);
  });

  // Get download counts per package
  const { data: downloadCounts } = await supabaseAdmin
    .from("download_logs")
    .select("package_id");

  const dlCountMap = new Map<string, number>();
  (downloadCounts ?? []).forEach((d) => {
    dlCountMap.set(d.package_id, (dlCountMap.get(d.package_id) ?? 0) + 1);
  });

  // Get license counts per package
  const { data: licenseCounts } = await supabaseAdmin
    .from("licenses")
    .select("package_id, status");

  const licCountMap = new Map<string, { active: number; total: number }>();
  (licenseCounts ?? []).forEach((l) => {
    const entry = licCountMap.get(l.package_id) ?? { active: 0, total: 0 };
    entry.total++;
    if (l.status === "active") entry.active++;
    licCountMap.set(l.package_id, entry);
  });

  const packageRevenue = (packages ?? []).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    type: pkg.type,
    price_cents: pkg.price_cents,
    is_published: pkg.is_published,
    users: entCountMap.get(pkg.id) ?? 0,
    downloads: dlCountMap.get(pkg.id) ?? 0,
    licenses: licCountMap.get(pkg.id) ?? { active: 0, total: 0 },
    estimated_revenue: (entCountMap.get(pkg.id) ?? 0) * (pkg.price_cents ?? 0),
  }));

  // Active users by day (last 30 days) - based on download_logs
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentDownloads } = await supabaseAdmin
    .from("download_logs")
    .select("user_id, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at");

  // Group by date
  const activeUsersByDay: Record<string, Set<string>> = {};
  (recentDownloads ?? []).forEach((dl) => {
    const date = new Date(dl.created_at).toISOString().split("T")[0];
    if (!activeUsersByDay[date]) activeUsersByDay[date] = new Set();
    activeUsersByDay[date].add(dl.user_id);
  });

  const activeUsersChartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    activeUsersChartData.push({
      date: dateStr,
      users: activeUsersByDay[dateStr]?.size ?? 0,
    });
  }

  // Top packages by estimated revenue
  const topPackages = [...packageRevenue]
    .sort((a, b) => b.estimated_revenue - a.estimated_revenue)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Package Dashboard"
        description="Software package metrics and analytics"
        actions={
          <Button asChild>
            <Link href="/admin/packages/new">
              <Package className="mr-2 h-4 w-4" />
              New Package
            </Link>
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Downloads"
          value={downloadsCount ?? 0}
          description="All-time downloads"
          icon={Download}
        />
        <StatCard
          title="Active Licenses"
          value={activeLicenses ?? 0}
          description={`${totalLicenses ?? 0} total licenses`}
          icon={KeyRound}
        />
        <StatCard
          title="Package Revenue"
          value={`$${(packageRevenue.reduce((s, p) => s + p.estimated_revenue, 0) / 100).toFixed(0)}`}
          description={`Across ${publishedPackages ?? 0} published packages`}
          icon={DollarSign}
        />
        <StatCard
          title="Package Users"
          value={activePackageUsers ?? 0}
          description="Users with active access"
          icon={Users}
        />
      </StatCardGrid>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Active Users (30 Days)</CardTitle>
            <CardDescription>Unique users downloading per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ActiveUsersChart data={activeUsersChartData} />
          </CardContent>
        </Card>

        {/* Revenue by Package */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue by Package</CardTitle>
              <CardDescription>Estimated revenue from package sales</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/packages">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <PackageRevenueTable packages={topPackages} />
          </CardContent>
        </Card>
      </div>

      {/* Package Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
          <CardDescription>Overview of all software packages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Package</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium text-right">Users</th>
                  <th className="pb-2 font-medium text-right">Downloads</th>
                  <th className="pb-2 font-medium text-right">Licenses</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {packageRevenue.map((pkg) => (
                  <tr key={pkg.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link href={`/admin/packages/${pkg.id}`} className="font-medium hover:underline">
                        {pkg.name}
                      </Link>
                      {!pkg.is_published && (
                        <Badge variant="secondary" className="ml-2 text-xs">Draft</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {pkg.type === "LOCAL_AGENT" ? "Local Agent" : "Cloud App"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">{pkg.users}</td>
                    <td className="py-3 text-right">{pkg.downloads}</td>
                    <td className="py-3 text-right">
                      {pkg.licenses.active} / {pkg.licenses.total}
                    </td>
                    <td className="py-3 text-right font-medium">
                      ${(pkg.estimated_revenue / 100).toFixed(0)}
                    </td>
                  </tr>
                ))}
                {packageRevenue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No packages yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
