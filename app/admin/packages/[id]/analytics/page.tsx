import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, Monitor, Smartphone, Laptop, Globe } from "lucide-react";
import { DownloadsOverTimeChart } from "@/components/analytics/DownloadsOverTimeChart";

export default async function PackageAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/app");

  // Get package
  const { data: pkg } = await supabaseAdmin
    .from("packages")
    .select("id, name, slug, type")
    .eq("id", params.id)
    .single();

  if (!pkg) notFound();

  // Downloads over time (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: downloads } = await supabaseAdmin
    .from("download_logs")
    .select("id, created_at, release_id, user_id")
    .eq("package_id", pkg.id)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at");

  // Total downloads all time
  const { count: totalDownloads } = await supabaseAdmin
    .from("download_logs")
    .select("id", { count: "exact", head: true })
    .eq("package_id", pkg.id);

  // Unique users who downloaded
  const uniqueDownloadUsers = new Set(
    (downloads ?? []).map((d) => d.user_id)
  ).size;

  // Group downloads by day
  const dlByDay: Record<string, number> = {};
  (downloads ?? []).forEach((dl) => {
    const date = new Date(dl.created_at).toISOString().split("T")[0];
    dlByDay[date] = (dlByDay[date] ?? 0) + 1;
  });

  const downloadsChartData = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    downloadsChartData.push({
      date: dateStr,
      downloads: dlByDay[dateStr] ?? 0,
    });
  }

  // Downloads by version
  const releaseIds = [...new Set((downloads ?? []).map((d) => d.release_id).filter(Boolean))];
  let versionDownloads: Array<{ version: string; channel: string; downloads: number }> = [];

  if (releaseIds.length > 0) {
    const { data: releases } = await supabaseAdmin
      .from("package_releases")
      .select("id, version, channel, download_count")
      .eq("package_id", pkg.id)
      .order("version_major", { ascending: false })
      .order("version_minor", { ascending: false })
      .order("version_patch", { ascending: false })
      .limit(20);

    versionDownloads = (releases ?? []).map((r) => ({
      version: r.version,
      channel: r.channel,
      downloads: r.download_count ?? 0,
    }));
  } else {
    // Fall back to release download_count
    const { data: releases } = await supabaseAdmin
      .from("package_releases")
      .select("id, version, channel, download_count")
      .eq("package_id", pkg.id)
      .order("version_major", { ascending: false })
      .order("version_minor", { ascending: false })
      .order("version_patch", { ascending: false })
      .limit(20);

    versionDownloads = (releases ?? []).map((r) => ({
      version: r.version,
      channel: r.channel,
      downloads: r.download_count ?? 0,
    }));
  }

  // Device type breakdown from device_activations for this package's licenses
  const { data: licenses } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .eq("package_id", pkg.id);

  const licenseIds = (licenses ?? []).map((l) => l.id);
  let deviceBreakdown: Record<string, number> = {};

  if (licenseIds.length > 0) {
    const { data: activations } = await supabaseAdmin
      .from("device_activations")
      .select("device_type")
      .in("license_id", licenseIds)
      .eq("is_active", true);

    (activations ?? []).forEach((a) => {
      const type = a.device_type || "unknown";
      deviceBreakdown[type] = (deviceBreakdown[type] ?? 0) + 1;
    });
  }

  const deviceIcons: Record<string, typeof Monitor> = {
    desktop: Monitor,
    laptop: Laptop,
    mobile: Smartphone,
  };

  const channelColors: Record<string, string> = {
    stable: "bg-green-100 text-green-800",
    beta: "bg-orange-100 text-orange-800",
    alpha: "bg-red-100 text-red-800",
    dev: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${pkg.name} Analytics`}
        description="Download metrics and usage analytics"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/packages/${pkg.id}`}>Edit Package</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/packages/${pkg.id}/releases`}>Releases</Link>
            </Button>
          </div>
        }
      />

      <StatCardGrid columns={3}>
        <StatCard
          title="Total Downloads"
          value={totalDownloads ?? 0}
          description="All-time"
          icon={Download}
        />
        <StatCard
          title="Downloads (90d)"
          value={(downloads ?? []).length}
          description={`${uniqueDownloadUsers} unique users`}
          icon={Download}
        />
        <StatCard
          title="Active Devices"
          value={Object.values(deviceBreakdown).reduce((s, v) => s + v, 0)}
          description={`${Object.keys(deviceBreakdown).length} device types`}
          icon={Monitor}
        />
      </StatCardGrid>

      {/* Downloads Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Downloads Over Time</CardTitle>
          <CardDescription>Last 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          <DownloadsOverTimeChart data={downloadsChartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Downloads by Version */}
        <Card>
          <CardHeader>
            <CardTitle>Downloads by Version</CardTitle>
            <CardDescription>Latest releases</CardDescription>
          </CardHeader>
          <CardContent>
            {versionDownloads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No releases yet</p>
            ) : (
              <div className="space-y-2">
                {versionDownloads.map((v) => (
                  <div key={v.version} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">v{v.version}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${channelColors[v.channel] || "bg-gray-100 text-gray-800"}`}>
                        {v.channel}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {v.downloads} downloads
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Type Breakdown</CardTitle>
            <CardDescription>Active device activations</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(deviceBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active devices</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(deviceBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const DeviceIcon = deviceIcons[type] || Globe;
                    const total = Object.values(deviceBreakdown).reduce((s, v) => s + v, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">{type}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
