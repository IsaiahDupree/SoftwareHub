import { supabaseServer } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PackageChangelogPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get package
  const { data: pkg } = await supabase
    .from("packages")
    .select("id, name, slug, icon_url")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!pkg) notFound();

  // Get all releases (not yanked)
  const { data: releases } = await supabase
    .from("package_releases")
    .select("*")
    .eq("package_id", pkg.id)
    .eq("is_yanked", false)
    .order("version_major", { ascending: false })
    .order("version_minor", { ascending: false })
    .order("version_patch", { ascending: false });

  const channelColors: Record<string, string> = {
    stable: "bg-green-100 text-green-800",
    beta: "bg-orange-100 text-orange-800",
    alpha: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${pkg.name} - Changelog`}
        description="Release history and version notes"
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/downloads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Downloads
            </Link>
          </Button>
        }
      />

      {!releases || releases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No releases published yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
            <Card key={release.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      v{release.version}
                    </CardTitle>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${channelColors[release.channel] || "bg-gray-100 text-gray-800"}`}>
                      {release.channel}
                    </span>
                    {release.is_current && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {release.published_at && (
                      <span>
                        {new Date(release.published_at).toLocaleDateString()}
                      </span>
                    )}
                    {release.file_size && (
                      <span>&middot; {formatBytes(release.file_size)}</span>
                    )}
                    {release.download_url && (
                      <Badge variant="outline" className="text-xs">
                        <Download className="mr-1 h-3 w-3" />
                        {release.download_count || 0}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {release.release_notes && (
                <CardContent>
                  {release.is_breaking && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm mb-3 p-2 bg-orange-50 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      Breaking changes in this release
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {release.release_notes}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
