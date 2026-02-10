import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Package, Monitor, Cloud } from "lucide-react";

export default async function AdminPackagesPage() {
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

  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    operational: "bg-green-100 text-green-800",
    degraded: "bg-yellow-100 text-yellow-800",
    down: "bg-red-100 text-red-800",
    maintenance: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages"
        description="Manage software packages and releases"
        actions={
          <Button asChild>
            <Link href="/admin/packages/new">
              <Plus className="mr-2 h-4 w-4" />
              New Package
            </Link>
          </Button>
        }
      />

      {!packages || packages.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No packages yet"
          description="Create your first software package"
          action={
            <Button asChild>
              <Link href="/admin/packages/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Package
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Packages ({packages.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Version</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Published</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {pkg.type === "LOCAL_AGENT" ? (
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Cloud className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{pkg.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {pkg.type === "LOCAL_AGENT" ? "Local Agent" : "Cloud App"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[pkg.status] || "bg-gray-100 text-gray-800"}`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {pkg.current_version || "—"}
                      </td>
                      <td className="p-4">
                        {pkg.price_cents ? `$${(pkg.price_cents / 100).toFixed(2)}` : "—"}
                      </td>
                      <td className="p-4">
                        <Badge variant={pkg.is_published ? "success" : "secondary"}>
                          {pkg.is_published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/packages/${pkg.id}/analytics`}>
                            Analytics
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/packages/${pkg.id}/releases`}>
                            Releases
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/packages/${pkg.id}`}>
                            Edit
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
