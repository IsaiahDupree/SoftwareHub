import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, Monitor, Smartphone, Laptop } from "lucide-react";
import { LicenseActions } from "@/components/admin/LicenseActions";

export default async function AdminLicenseDetailPage({
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

  if (profile?.role !== "admin") {
    redirect("/app");
  }

  const { data: license } = await supabase
    .from("licenses")
    .select(`
      *,
      packages:package_id (id, name, slug, icon_url, type),
      users:user_id (id, email, full_name)
    `)
    .eq("id", params.id)
    .single();

  if (!license) {
    notFound();
  }

  const { data: activations } = await supabase
    .from("device_activations")
    .select("*")
    .eq("license_id", params.id)
    .order("created_at", { ascending: false });

  const pkg = license.packages as Record<string, unknown> | null;
  const licUser = license.users as Record<string, unknown> | null;

  function maskKey(key: string | null): string {
    if (!key) return "****-****-****-****";
    const parts = key.split("-");
    if (parts.length === 4) return `****-****-****-${parts[3]}`;
    return "****-****-****-****";
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-yellow-100 text-yellow-800",
    revoked: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };

  const deviceIcons: Record<string, typeof Monitor> = {
    desktop: Monitor,
    mobile: Smartphone,
    laptop: Laptop,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="License Details"
        description={maskKey(license.license_key)}
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/licenses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Licenses
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* License Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">License Key</dt>
                <dd className="font-mono mt-1">{maskKey(license.license_key)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[license.status] || "bg-gray-100 text-gray-800"}`}>
                    {license.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="mt-1">
                  <Badge variant="outline">{license.license_type}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Devices</dt>
                <dd className="mt-1">{license.active_devices} / {license.max_devices}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Package</dt>
                <dd className="mt-1">
                  {pkg ? (
                    <Link href={`/admin/packages/${pkg.id}`} className="text-primary hover:underline">
                      {pkg.name as string}
                    </Link>
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">User</dt>
                <dd className="mt-1">{(licUser?.email as string) || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="mt-1">{license.source || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="mt-1">{new Date(license.created_at).toLocaleString()}</dd>
              </div>
              {license.activated_at && (
                <div>
                  <dt className="text-muted-foreground">First Activated</dt>
                  <dd className="mt-1">{new Date(license.activated_at).toLocaleString()}</dd>
                </div>
              )}
              {license.expires_at && (
                <div>
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd className="mt-1">{new Date(license.expires_at).toLocaleString()}</dd>
                </div>
              )}
              {license.revoked_at && (
                <div>
                  <dt className="text-muted-foreground">Revoked At</dt>
                  <dd className="mt-1 text-red-600">{new Date(license.revoked_at).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <LicenseActions
              licenseId={license.id}
              currentStatus={license.status}
              maxDevices={license.max_devices}
              expiresAt={license.expires_at}
            />
          </CardContent>
        </Card>
      </div>

      {/* Device Activations */}
      <Card>
        <CardHeader>
          <CardTitle>
            Device Activations ({activations?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!activations || activations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No device activations yet
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Device</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">OS</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Last Seen</th>
                    <th className="text-left p-4 font-medium">IP Address</th>
                    <th className="text-left p-4 font-medium">Activated</th>
                  </tr>
                </thead>
                <tbody>
                  {activations.map((activation) => {
                    const DeviceIcon = deviceIcons[activation.device_type] || Monitor;
                    return (
                      <tr key={activation.id} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{activation.device_name || "Unknown device"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {activation.device_type || "—"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {[activation.os_name, activation.os_version].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="p-4">
                          <Badge variant={activation.is_active ? "default" : "secondary"}>
                            {activation.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {activation.last_seen_at
                            ? new Date(activation.last_seen_at).toLocaleString()
                            : "—"
                          }
                        </td>
                        <td className="p-4 text-muted-foreground font-mono text-xs">
                          {activation.last_ip_address || "—"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(activation.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
