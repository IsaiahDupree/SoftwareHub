import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Monitor, Cloud, Package, Download, Clock } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = supabaseServer();
  const { data: pkg } = await supabase
    .from("packages")
    .select("name, tagline, description, icon_url, type")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!pkg) {
    return { title: "Package Not Found | SoftwareHub" };
  }

  const typeLabel = pkg.type === "LOCAL_AGENT" ? "Local Agent" : "Cloud App";
  const description = pkg.tagline || pkg.description?.slice(0, 160) || `${pkg.name} - ${typeLabel}`;

  return {
    title: `${pkg.name} | SoftwareHub`,
    description,
    openGraph: {
      title: `${pkg.name} - ${typeLabel}`,
      description,
      type: "website",
      ...(pkg.icon_url ? { images: [{ url: pkg.icon_url, width: 256, height: 256, alt: pkg.name }] } : {}),
    },
    twitter: {
      card: "summary",
      title: `${pkg.name} | SoftwareHub`,
      description,
    },
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = supabaseServer();

  // Get package
  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!pkg) notFound();

  // Check if user has access
  const { data: { user } } = await supabase.auth.getUser();
  let hasAccess = false;
  let trialAvailable = false;
  let existingTrial: { expires_at: string; started_at: string } | null = null;

  if (user) {
    const { data: entitlement } = await supabase
      .from("package_entitlements")
      .select("id")
      .eq("user_id", user.id)
      .eq("package_id", pkg.id)
      .eq("has_access", true)
      .maybeSingle();

    hasAccess = !!entitlement;

    // Check trial availability
    if (!hasAccess && pkg.trial_enabled) {
      const { data: trial } = await supabaseAdmin
        .from("package_trials")
        .select("id, started_at, expires_at")
        .eq("user_id", user.id)
        .eq("package_id", pkg.id)
        .maybeSingle();

      if (trial) {
        existingTrial = trial;
      } else {
        trialAvailable = true;
      }
    }
  } else if (pkg.trial_enabled) {
    trialAvailable = true; // Show trial CTA to prompt sign-in
  }

  // Get current release info
  const { data: currentRelease } = await supabase
    .from("package_releases")
    .select("version, published_at, file_size, release_notes")
    .eq("package_id", pkg.id)
    .eq("is_current", true)
    .eq("channel", "stable")
    .maybeSingle();

  // Get related course
  let relatedCourse: { id: string; title: string; slug: string; description: string | null } | null = null;
  if (pkg.related_course_id) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, title, slug, description")
      .eq("id", pkg.related_course_id)
      .eq("is_published", true)
      .maybeSingle();
    relatedCourse = course;
  }

  const features = pkg.features || [];
  const requirements = pkg.requirements || {};

  const typeLabel = pkg.type === "LOCAL_AGENT" ? "Local Agent" : "Cloud App";
  const TypeIcon = pkg.type === "LOCAL_AGENT" ? Monitor : Cloud;

  return (
    <main className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          {pkg.icon_url ? (
            <img
              src={pkg.icon_url}
              alt={pkg.name}
              className="h-24 w-24 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {typeLabel}
            </Badge>
            {currentRelease && (
              <Badge variant="secondary">v{currentRelease.version}</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{pkg.name}</h1>
          {pkg.tagline && (
            <p className="text-lg text-muted-foreground mb-4">{pkg.tagline}</p>
          )}
          <div className="flex items-center gap-3">
            {hasAccess ? (
              <Button asChild>
                <Link href="/app/downloads">
                  <Download className="mr-2 h-4 w-4" />
                  Go to Downloads
                </Link>
              </Button>
            ) : pkg.price_cents ? (
              <>
                <form action={`/api/packages/${pkg.slug}/checkout`} method="POST">
                  <Button type="submit" size="lg">
                    Purchase for ${(pkg.price_cents / 100).toFixed(2)}
                  </Button>
                </form>
                {trialAvailable && (
                  <Button variant="outline" size="lg" asChild>
                    <Link href={user ? `/api/packages/${pkg.slug}/trial` : `/login?next=/packages/${pkg.slug}`}>
                      <Clock className="mr-2 h-4 w-4" />
                      Start {pkg.trial_days || 7}-Day Trial
                    </Link>
                  </Button>
                )}
                {existingTrial && new Date(existingTrial.expires_at) > new Date() && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    Trial expires {new Date(existingTrial.expires_at).toLocaleDateString()}
                  </Badge>
                )}
                {existingTrial && new Date(existingTrial.expires_at) <= new Date() && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    Trial expired
                  </Badge>
                )}
              </>
            ) : (
              <>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  Coming Soon
                </Badge>
                {trialAvailable && (
                  <Button variant="outline" size="lg" asChild>
                    <Link href={user ? `/api/packages/${pkg.slug}/trial` : `/login?next=/packages/${pkg.slug}`}>
                      <Clock className="mr-2 h-4 w-4" />
                      Start {pkg.trial_days || 7}-Day Trial
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {pkg.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {pkg.description}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
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

          {/* Screenshots */}
          {pkg.screenshots && pkg.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {pkg.screenshots.map((url: string, i: number) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${pkg.name} screenshot ${i + 1}`}
                      className="rounded-lg border object-cover w-full"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Course */}
          {relatedCourse && (
            <Card>
              <CardHeader>
                <CardTitle>Related Course</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/courses/${relatedCourse.slug}`}
                  className="block p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <p className="font-medium text-sm">{relatedCourse.title}</p>
                  {relatedCourse.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {relatedCourse.description}
                    </p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {Object.keys(requirements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  {Object.entries(requirements).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Release Info */}
          {currentRelease && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Release</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Version: <span className="font-medium">{currentRelease.version}</span></p>
                {currentRelease.published_at && (
                  <p>Released: {new Date(currentRelease.published_at).toLocaleDateString()}</p>
                )}
                {currentRelease.file_size && (
                  <p>Size: {(currentRelease.file_size / (1024 * 1024)).toFixed(1)} MB</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  pkg.status === "operational"
                    ? "bg-green-500"
                    : pkg.status === "degraded"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`} />
                <span className="text-sm capitalize">{pkg.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
