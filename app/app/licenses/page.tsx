import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyRound } from "lucide-react";
import { LicenseCard } from "@/components/licenses/LicenseCard";

export default async function UserLicensesPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's licenses with package info and device activations
  const { data: licenses } = await supabase
    .from("licenses")
    .select(`
      id,
      license_key,
      license_type,
      status,
      active_devices,
      max_devices,
      expires_at,
      created_at,
      packages:package_id (id, name, slug, icon_url),
      device_activations (
        id,
        device_name,
        device_type,
        os_name,
        os_version,
        is_active,
        last_seen_at,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Mask license keys for display
  const maskedLicenses = (licenses ?? []).map((license) => ({
    ...license,
    license_key: maskKey(license.license_key),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licenses & Devices"
        description="Manage your software licenses and activated devices"
      />

      {!maskedLicenses || maskedLicenses.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No licenses yet"
          description="Purchase a software package to receive a license key"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {maskedLicenses.map((license) => (
            <LicenseCard key={license.id} license={license as never} />
          ))}
        </div>
      )}
    </div>
  );
}

function maskKey(key: string | null): string {
  if (!key) return "****-****-****-****";
  const parts = key.split("-");
  if (parts.length === 4) return `****-****-****-${parts[3]}`;
  return "****-****-****-****";
}
