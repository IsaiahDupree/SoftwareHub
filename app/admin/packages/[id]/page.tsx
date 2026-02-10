import { supabaseServer } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PackageForm from "@/components/admin/PackageForm";

interface PageProps {
  params: { id: string };
}

export default async function AdminEditPackagePage({ params }: PageProps) {
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

  const { data: pkg, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !pkg) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${pkg.name}`}
        description={`/${pkg.slug}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/packages/${pkg.id}/releases`}>
              Manage Releases
            </Link>
          </Button>
        }
      />
      <PackageForm package={pkg} mode="edit" />
    </div>
  );
}
