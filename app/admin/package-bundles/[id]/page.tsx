import { redirect, notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PackageBundleForm from "@/components/admin/PackageBundleForm";

export default async function EditPackageBundlePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/package-bundles/" + params.id);

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/app");

  const { data: bundle } = await supabaseAdmin
    .from("package_bundles")
    .select(`
      *,
      package_bundle_items (
        package_id,
        sort_order
      )
    `)
    .eq("id", params.id)
    .single();

  if (!bundle) notFound();

  const packageIds = (bundle.package_bundle_items || [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((item: { package_id: string }) => item.package_id);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <PackageBundleForm
        bundle={{
          id: bundle.id,
          name: bundle.name,
          slug: bundle.slug,
          description: bundle.description,
          badge: bundle.badge,
          price_cents: bundle.price_cents,
          compare_at_cents: bundle.compare_at_cents,
          stripe_product_id: bundle.stripe_product_id,
          stripe_price_id: bundle.stripe_price_id,
          icon_url: bundle.icon_url,
          banner_url: bundle.banner_url,
          features: bundle.features || [],
          is_published: bundle.is_published,
          is_featured: bundle.is_featured,
          package_ids: packageIds,
        }}
        isNew={false}
      />
    </main>
  );
}
