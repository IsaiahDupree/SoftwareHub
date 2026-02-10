"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, BookOpen, Package, Monitor, Cloud } from "lucide-react";

interface ProductCardProps {
  type: "course" | "LOCAL_AGENT" | "CLOUD_APP";
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  status?: string;
  version?: string | null;
  packageId?: string;
}

const typeLabels: Record<string, string> = {
  course: "Course",
  LOCAL_AGENT: "Local Agent",
  CLOUD_APP: "Cloud App",
};

const typeIcons: Record<string, typeof Package> = {
  course: BookOpen,
  LOCAL_AGENT: Monitor,
  CLOUD_APP: Cloud,
};

const typeBadgeColors: Record<string, string> = {
  course: "bg-blue-100 text-blue-800",
  LOCAL_AGENT: "bg-purple-100 text-purple-800",
  CLOUD_APP: "bg-green-100 text-green-800",
};

export function ProductCard({
  type,
  name,
  slug,
  iconUrl,
  description,
  status,
  version,
  packageId,
}: ProductCardProps) {
  const TypeIcon = typeIcons[type] || Package;
  const [ssoLoading, setSsoLoading] = useState(false);

  async function handleOpenCloudApp() {
    if (!packageId) return;
    setSsoLoading(true);
    try {
      const res = await fetch("/api/cloud-sso/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId }),
      });
      if (!res.ok) throw new Error("SSO failed");
      const data = await res.json();
      window.open(data.redirect_url, "_blank");
    } catch {
      // Silently fail
    } finally {
      setSsoLoading(false);
    }
  }

  function getActionButton() {
    switch (type) {
      case "LOCAL_AGENT":
        return (
          <Button size="sm" asChild>
            <Link href="/app/downloads">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Link>
          </Button>
        );
      case "CLOUD_APP":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCloudApp}
            disabled={ssoLoading}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {ssoLoading ? "Loading..." : "Open App"}
          </Button>
        );
      case "course":
        return (
          <Button size="sm" asChild>
            <Link href={`/app/courses/${slug}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Access Course
            </Link>
          </Button>
        );
      default:
        return null;
    }
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-base">{name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadgeColors[type] || "bg-gray-100 text-gray-800"}`}>
                {typeLabels[type] || type}
              </span>
              {version && (
                <Badge variant="outline" className="text-xs">
                  v{version}
                </Badge>
              )}
              {status && status !== "operational" && (
                <Badge variant="destructive" className="text-xs">
                  {status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}
        {getActionButton()}
      </CardContent>
    </Card>
  );
}
