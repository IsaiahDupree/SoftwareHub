import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import PackageBundleForm from "@/components/admin/PackageBundleForm";

export default async function NewPackageBundlePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/package-bundles/new");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/app");

  const emptyBundle = {
    name: "",
    slug: "",
    description: null,
    badge: null,
    price_cents: 0,
    compare_at_cents: null,
    stripe_product_id: null,
    stripe_price_id: null,
    icon_url: null,
    banner_url: null,
    features: [],
    is_published: false,
    is_featured: false,
    package_ids: [],
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <PackageBundleForm bundle={emptyBundle} isNew={true} />
    </main>
  );
}
