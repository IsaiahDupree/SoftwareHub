import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { KeyRound, CheckCircle, AlertTriangle, Monitor, Clock } from "lucide-react";

export default async function LicenseAnalyticsPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/app");

  // Get all licenses with package info
  const { data: licenses } = await supabaseAdmin
    .from("licenses")
    .select("id, status, license_type, max_devices, expires_at, package_id, created_at");

  const allLicenses = licenses ?? [];
  const activeLicenses = allLicenses.filter((l) => l.status === "active");
  const suspendedLicenses = allLicenses.filter((l) => l.status === "suspended");
  const revokedLicenses = allLicenses.filter((l) => l.status === "revoked");
  const expiredLicenses = allLicenses.filter((l) => l.status === "expired");

  // Get all device activations
  const { data: activations } = await supabaseAdmin
    .from("device_activations")
    .select("id, license_id, is_active");

  const allActivations = activations ?? [];
  const activeActivations = allActivations.filter((a) => a.is_active);

  // Activation success rate
  const { count: totalActivationAttempts } = await supabaseAdmin
    .from("device_activations")
    .select("id", { count: "exact", head: true });

  const activationSuccessRate =
    totalActivationAttempts && totalActivationAttempts > 0
      ? Math.round((activeActivations.length / totalActivationAttempts) * 100)
      : 0;

  // Device utilization: how many licenses are using their full device slots
  let totalDeviceSlots = 0;
  let usedDeviceSlots = 0;
  const licenseDeviceMap = new Map<string, number>();

  activeActivations.forEach((a) => {
    licenseDeviceMap.set(a.license_id, (licenseDeviceMap.get(a.license_id) ?? 0) + 1);
  });

  activeLicenses.forEach((l) => {
    totalDeviceSlots += l.max_devices;
    usedDeviceSlots += licenseDeviceMap.get(l.id) ?? 0;
  });

  const deviceUtilization =
    totalDeviceSlots > 0
      ? Math.round((usedDeviceSlots / totalDeviceSlots) * 100)
      : 0;

  // Expiring soon (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringSoon = activeLicenses.filter((l) => {
    if (!l.expires_at) return false;
    const expires = new Date(l.expires_at);
    return expires >= now && expires <= thirtyDaysFromNow;
  });

  // Licenses by package
  const packageIds = [...new Set(allLicenses.map((l) => l.package_id))];
  let packageMap = new Map<string, string>();

  if (packageIds.length > 0) {
    const { data: packages } = await supabaseAdmin
      .from("packages")
      .select("id, name")
      .in("id", packageIds);
    (packages ?? []).forEach((p) => packageMap.set(p.id, p.name));
  }

  // Group by package
  const byPackage: Record<string, { active: number; total: number; devices: number }> = {};
  allLicenses.forEach((l) => {
    const pkgName = packageMap.get(l.package_id) || "Unknown";
    if (!byPackage[pkgName]) byPackage[pkgName] = { active: 0, total: 0, devices: 0 };
    byPackage[pkgName].total++;
    if (l.status === "active") {
      byPackage[pkgName].active++;
      byPackage[pkgName].devices += licenseDeviceMap.get(l.id) ?? 0;
    }
  });

  // License type breakdown
  const typeBreakdown: Record<string, number> = {};
  allLicenses.forEach((l) => {
    typeBreakdown[l.license_type] = (typeBreakdown[l.license_type] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="License Analytics"
        description="License management metrics and insights"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/licenses">Manage Licenses</Link>
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Active Licenses"
          value={activeLicenses.length}
          description={`${allLicenses.length} total`}
          icon={KeyRound}
        />
        <StatCard
          title="Activation Rate"
          value={`${activationSuccessRate}%`}
          description={`${activeActivations.length} active devices`}
          icon={CheckCircle}
        />
        <StatCard
          title="Device Utilization"
          value={`${deviceUtilization}%`}
          description={`${usedDeviceSlots} / ${totalDeviceSlots} slots used`}
          icon={Monitor}
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoon.length}
          description="Next 30 days"
          icon={Clock}
          changeType={expiringSoon.length > 0 ? "negative" : "neutral"}
          change={expiringSoon.length > 0 ? "Action needed" : undefined}
        />
      </StatCardGrid>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>License Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Active", count: activeLicenses.length, color: "bg-green-500" },
                { label: "Suspended", count: suspendedLicenses.length, color: "bg-yellow-500" },
                { label: "Revoked", count: revokedLicenses.length, color: "bg-red-500" },
                { label: "Expired", count: expiredLicenses.length, color: "bg-gray-400" },
              ].map((status) => {
                const pct = allLicenses.length > 0
                  ? Math.round((status.count / allLicenses.length) * 100)
                  : 0;
                return (
                  <div key={status.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{status.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {status.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${status.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* License Types */}
        <Card>
          <CardHeader>
            <CardTitle>License Types</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(typeBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No licenses yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(typeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const pct = allLicenses.length > 0
                      ? Math.round((count / allLicenses.length) * 100)
                      : 0;
                    return (
                      <div key={type} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{type}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Licenses by Package */}
      <Card>
        <CardHeader>
          <CardTitle>Licenses by Package</CardTitle>
          <CardDescription>Active and total licenses per package</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Package</th>
                  <th className="pb-2 font-medium text-right">Active</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-right">Active Devices</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byPackage)
                  .sort(([, a], [, b]) => b.active - a.active)
                  .map(([pkgName, data]) => (
                    <tr key={pkgName} className="border-b last:border-0">
                      <td className="py-3 font-medium">{pkgName}</td>
                      <td className="py-3 text-right">
                        <Badge variant="success" className="text-xs">{data.active}</Badge>
                      </td>
                      <td className="py-3 text-right">{data.total}</td>
                      <td className="py-3 text-right">{data.devices}</td>
                      <td className="py-3 text-right text-muted-foreground">
                        {data.total > 0 ? Math.round((data.active / data.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                {Object.keys(byPackage).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No licenses yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle>Expiring Soon ({expiringSoon.length})</CardTitle>
            </div>
            <CardDescription>Licenses expiring in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringSoon.slice(0, 20).map((license) => {
                const daysLeft = Math.ceil(
                  (new Date(license.expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={license.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {packageMap.get(license.package_id) || "Unknown"}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {license.license_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={daysLeft <= 7 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/licenses/${license.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
