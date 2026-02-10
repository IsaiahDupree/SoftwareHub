import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyRound, Search } from "lucide-react";
import { LicenseSearchForm } from "@/components/admin/LicenseSearchForm";

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; page?: string };
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

  const page = parseInt(searchParams.page || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("licenses")
    .select(`
      *,
      packages:package_id (id, name, slug, icon_url),
      users:user_id (id, email, full_name)
    `, { count: "exact" });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.search) {
    query = query.or(`license_key.ilike.%${searchParams.search}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: licenses, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-yellow-100 text-yellow-800",
    revoked: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };

  function maskKey(key: string | null): string {
    if (!key) return "****-****-****-****";
    const parts = key.split("-");
    if (parts.length === 4) return `****-****-****-${parts[3]}`;
    return "****-****-****-****";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licenses"
        description="Manage software license keys and activations"
      />

      <LicenseSearchForm
        currentStatus={searchParams.status}
        currentSearch={searchParams.search}
      />

      {!licenses || licenses.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No licenses found"
          description={searchParams.search || searchParams.status
            ? "Try adjusting your filters"
            : "Licenses are created when users purchase packages"
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Licenses ({count ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">License Key</th>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Package</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Devices</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license: Record<string, unknown>) => {
                    const pkg = license.packages as Record<string, unknown> | null;
                    const licUser = license.users as Record<string, unknown> | null;
                    return (
                      <tr key={license.id as string} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-mono text-xs">
                          {maskKey(license.license_key as string | null)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {(licUser?.email as string) || "—"}
                          </div>
                        </td>
                        <td className="p-4">
                          {pkg ? (
                            <Link
                              href={`/admin/packages/${pkg.id}`}
                              className="text-primary hover:underline"
                            >
                              {pkg.name as string}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[license.status as string] || "bg-gray-100 text-gray-800"}`}>
                            {license.status as string}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            {license.license_type as string}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {license.active_devices as number}/{license.max_devices as number}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(license.created_at as string).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/licenses/${license.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({count} total)
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/licenses?page=${page - 1}${searchParams.status ? `&status=${searchParams.status}` : ""}${searchParams.search ? `&search=${searchParams.search}` : ""}`}>
                        Previous
                      </Link>
                    </Button>
                  )}
                  {page < totalPages && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/licenses?page=${page + 1}${searchParams.status ? `&status=${searchParams.status}` : ""}${searchParams.search ? `&search=${searchParams.search}` : ""}`}>
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
