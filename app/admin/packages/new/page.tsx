import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import PackageForm from "@/components/admin/PackageForm";

export default async function AdminNewPackagePage() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Package"
        description="Create a new software package"
      />
      <PackageForm mode="create" />
    </div>
  );
}
