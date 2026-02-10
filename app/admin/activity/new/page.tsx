"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

interface PackageOption {
  id: string;
  name: string;
}

export default function AdminAnnouncementPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [packageId, setPackageId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch("/api/admin/packages");
        if (res.ok) {
          const data = await res.json();
          setPackages(data.packages || []);
        }
      } catch {
        // Packages optional
      }
    }
    loadPackages();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "announcement",
          title: title.trim(),
          body: body.trim() || null,
          package_id: packageId || null,
          is_pinned: isPinned,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          visibility: "public",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create announcement");
      }

      router.push("/app/activity");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Announcement"
        description="Create an announcement for the activity feed"
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Body (Markdown)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Announcement details..."
                  rows={6}
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Package (optional)</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">All packages</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border"
                />
                <label htmlFor="pinned" className="text-sm">
                  Pin to top of feed
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Expiration (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Publishing..." : "Publish Announcement"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreview(!preview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {preview ? "Hide Preview" : "Preview"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {isPinned && (
                    <span className="text-xs text-primary">Pinned</span>
                  )}
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-800">
                    announcement
                  </span>
                </div>
                <h3 className="font-medium">{title || "Untitled"}</h3>
                {body && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">just now</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
