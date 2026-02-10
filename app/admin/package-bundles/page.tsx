import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

export default async function PackageBundlesPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/package-bundles");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/app");

  const { data: bundles } = await supabaseAdmin
    .from("package_bundles")
    .select(`
      *,
      package_bundle_items (
        package_id,
        packages:package_id ( id, name, slug )
      )
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Package Bundles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bundle multiple software packages into discounted offers
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/package-bundles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Bundle
          </Link>
        </Button>
      </div>

      {(!bundles || bundles.length === 0) ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No package bundles yet.</p>
          <p className="text-sm mt-1">Create your first bundle to offer discounted package combos.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Bundle</th>
                <th className="text-left px-4 py-3 font-medium">Packages</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bundles.map((bundle) => {
                const items = bundle.package_bundle_items || [];
                const packageNames = items
                  .map((item: { packages: { name: string } | null }) => item.packages?.name)
                  .filter(Boolean);

                return (
                  <tr key={bundle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/package-bundles/${bundle.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {bundle.name}
                      </Link>
                      {bundle.badge && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {bundle.badge}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {packageNames.length > 0
                        ? packageNames.join(", ")
                        : "No packages"}
                    </td>
                    <td className="px-4 py-3">
                      ${(bundle.price_cents / 100).toFixed(2)}
                      {bundle.compare_at_cents && (
                        <span className="text-gray-400 line-through ml-2">
                          ${(bundle.compare_at_cents / 100).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {bundle.is_published ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/package-bundles/${bundle.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
