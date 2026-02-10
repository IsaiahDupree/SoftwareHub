import { supabaseServer } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReleaseUploadForm from "@/components/admin/ReleaseUploadForm";

interface PageProps {
  params: { id: string };
}

export default async function AdminReleasesPage({ params }: PageProps) {
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

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("*")
    .eq("id", params.id)
    .single();

  if (pkgError || !pkg) {
    notFound();
  }

  const { data: releases } = await supabase
    .from("package_releases")
    .select("*")
    .eq("package_id", params.id)
    .order("created_at", { ascending: false });

  const channelColors: Record<string, string> = {
    stable: "bg-green-100 text-green-800",
    beta: "bg-yellow-100 text-yellow-800",
    alpha: "bg-orange-100 text-orange-800",
    dev: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Releases: ${pkg.name}`}
        description={`Manage versions and binaries for ${pkg.name}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/packages/${pkg.id}`}>Back to Package</Link>
          </Button>
        }
      />

      {/* Upload New Release */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Release</CardTitle>
        </CardHeader>
        <CardContent>
          <ReleaseUploadForm packageId={params.id} />
        </CardContent>
      </Card>

      {/* Existing Releases */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Releases ({releases?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!releases || releases.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No releases yet. Upload your first release above.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Version</th>
                    <th className="text-left p-4 font-medium">Channel</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Downloads</th>
                    <th className="text-left p-4 font-medium">File</th>
                    <th className="text-left p-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((release) => (
                    <tr
                      key={release.id}
                      className="border-t hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-medium">{release.version}</span>
                        {release.is_current && (
                          <Badge variant="success" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            channelColors[release.channel] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {release.channel}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Badge
                            variant={
                              release.is_published ? "success" : "secondary"
                            }
                          >
                            {release.is_published ? "Published" : "Draft"}
                          </Badge>
                          {release.is_yanked && (
                            <Badge variant="destructive">Yanked</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {release.downloads_count}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {release.file_name || "—"}
                        {release.file_size_bytes && (
                          <span className="ml-1 text-xs">
                            ({(release.file_size_bytes / 1024 / 1024).toFixed(1)}
                            MB)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(release.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
