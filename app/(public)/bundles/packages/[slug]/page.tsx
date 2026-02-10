import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Download, Layers } from "lucide-react";

export default async function PackageBundleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = supabaseServer();

  // Get bundle with items
  const { data: bundle } = await supabaseAdmin
    .from("package_bundles")
    .select(`
      *,
      package_bundle_items (
        package_id,
        sort_order,
        packages:package_id (
          id, name, slug, tagline, icon_url, price_cents, type, status
        )
      )
    `)
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!bundle) notFound();

  // Check if user has access to all packages in bundle
  const { data: { user } } = await supabase.auth.getUser();
  let ownsAll = false;

  const items = (bundle.package_bundle_items || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  const packageIds = items.map((item: { package_id: string }) => item.package_id);

  if (user && packageIds.length > 0) {
    const { data: entitlements } = await supabaseAdmin
      .from("package_entitlements")
      .select("package_id")
      .eq("user_id", user.id)
      .eq("has_access", true)
      .in("package_id", packageIds);

    ownsAll = (entitlements?.length || 0) === packageIds.length;
  }

  const individualTotal = items.reduce(
    (sum: number, item: { packages: { price_cents: number | null } | null }) =>
      sum + (item.packages?.price_cents || 0),
    0
  );
  const savings = individualTotal > 0 ? individualTotal - bundle.price_cents : 0;
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;
  const features = bundle.features || [];

  return (
    <main className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          {bundle.icon_url ? (
            <img
              src={bundle.icon_url}
              alt={bundle.name}
              className="h-24 w-24 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center">
              <Layers className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Package Bundle
            </Badge>
            {bundle.badge && (
              <Badge className="bg-amber-100 text-amber-800">{bundle.badge}</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{bundle.name}</h1>
          {bundle.description && (
            <p className="text-lg text-muted-foreground mb-4">{bundle.description}</p>
          )}
          <div className="flex items-center gap-4">
            {ownsAll ? (
              <Button asChild>
                <Link href="/app/downloads">
                  <Download className="mr-2 h-4 w-4" />
                  Go to Downloads
                </Link>
              </Button>
            ) : bundle.stripe_price_id ? (
              <form action={`/api/package-bundles/${bundle.slug}/checkout`} method="POST">
                <Button type="submit" size="lg">
                  Get Bundle for ${(bundle.price_cents / 100).toFixed(2)}
                </Button>
              </form>
            ) : (
              <Badge variant="secondary" className="text-base px-4 py-2">
                Coming Soon
              </Badge>
            )}
            {savings > 0 && !ownsAll && (
              <div className="text-sm">
                <span className="text-gray-400 line-through">
                  ${(individualTotal / 100).toFixed(2)}
                </span>
                <span className="ml-2 text-green-600 font-medium">
                  Save {savingsPercent}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Included Packages */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Included Packages ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item: {
                package_id: string;
                packages: {
                  id: string;
                  name: string;
                  slug: string;
                  tagline: string | null;
                  icon_url: string | null;
                  price_cents: number | null;
                  type: string;
                } | null;
              }) => {
                const pkg = item.packages;
                if (!pkg) return null;

                return (
                  <Link
                    key={pkg.id}
                    href={`/packages/${pkg.slug}`}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    {pkg.icon_url ? (
                      <img
                        src={pkg.icon_url}
                        alt={pkg.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{pkg.name}</p>
                      {pkg.tagline && (
                        <p className="text-sm text-muted-foreground truncate">
                          {pkg.tagline}
                        </p>
                      )}
                    </div>
                    {pkg.price_cents != null && (
                      <span className="text-sm text-gray-500">
                        ${(pkg.price_cents / 100).toFixed(2)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Features */}
          {features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What You Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bundle Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {items.length} packages individually
                </span>
                <span className="line-through text-gray-400">
                  ${(individualTotal / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Bundle price</span>
                <span>${(bundle.price_cents / 100).toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600 text-sm font-medium border-t pt-2">
                  <span>You save</span>
                  <span>${(savings / 100).toFixed(2)} ({savingsPercent}%)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's included summary */}
          <Card>
            <CardHeader>
              <CardTitle>Includes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>{items.length} software packages</p>
              <p>{items.length} license keys</p>
              <p>2 devices per license</p>
              <p>All future updates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
