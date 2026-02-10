import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Download } from "lucide-react";
import { DownloadCard } from "@/components/downloads/DownloadCard";
import { BetaToggle } from "@/components/downloads/BetaToggle";

export default async function UserDownloadsPage({
  searchParams,
}: {
  searchParams: { beta?: string };
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const showBeta = searchParams.beta === "true";
  const channel = showBeta ? "beta" : "stable";

  // Get user's package entitlements
  const { data: entitlements } = await supabase
    .from("package_entitlements")
    .select("package_id")
    .eq("user_id", user.id)
    .eq("has_access", true);

  const packageIds = (entitlements ?? []).map((e) => e.package_id);

  if (packageIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Downloads"
          description="Download your purchased software"
        />
        <EmptyState
          icon={Download}
          title="No downloads available"
          description="Purchase a software package to access downloads"
        />
      </div>
    );
  }

  // Get packages with current releases
  const { data: packages } = await supabase
    .from("packages")
    .select(`
      id,
      name,
      slug,
      icon_url,
      current_version,
      type
    `)
    .in("id", packageIds)
    .eq("is_published", true)
    .eq("type", "LOCAL_AGENT")
    .order("name");

  // Get current releases for each package
  const packageSlugs = (packages ?? []).map((p) => p.id);
  const { data: releases } = await supabase
    .from("package_releases")
    .select("package_id, version, release_notes, published_at, file_size, channel")
    .in("package_id", packageSlugs)
    .eq("is_current", true)
    .eq("channel", channel)
    .eq("is_yanked", false);

  const releaseMap = new Map(
    (releases ?? []).map((r) => [r.package_id, r])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Downloads"
        description="Download your purchased software"
        actions={<BetaToggle showBeta={showBeta} />}
      />

      {!packages || packages.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No downloadable packages"
          description="Your owned packages are cloud-based and don't require downloads"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((pkg) => {
            const release = releaseMap.get(pkg.id);
            return (
              <DownloadCard
                key={pkg.id}
                packageSlug={pkg.slug}
                packageName={pkg.name}
                iconUrl={pkg.icon_url}
                currentVersion={release?.version || pkg.current_version}
                releaseNotes={release?.release_notes || null}
                publishedAt={release?.published_at || null}
                fileSize={release?.file_size || null}
                channel={channel}
                changelogUrl={`/app/packages/${pkg.slug}/changelog`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
