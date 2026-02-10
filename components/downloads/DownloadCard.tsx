"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface DownloadCardProps {
  packageSlug: string;
  packageName: string;
  iconUrl: string | null;
  currentVersion: string | null;
  releaseNotes: string | null;
  publishedAt: string | null;
  fileSize: number | null;
  channel: string;
  changelogUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadCard({
  packageSlug,
  packageName,
  iconUrl,
  currentVersion,
  releaseNotes,
  publishedAt,
  fileSize,
  channel,
  changelogUrl,
}: DownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/packages/${packageSlug}/download?channel=${channel}`
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Download failed");
        return;
      }
      const data = await res.json();
      // Open download URL in new tab
      window.open(data.download_url, "_blank");
    } catch {
      alert("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={packageName}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{packageName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {currentVersion && (
                  <Badge variant="secondary">v{currentVersion}</Badge>
                )}
                {channel !== "stable" && (
                  <Badge variant="outline" className="text-orange-600">
                    {channel}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading || !currentVersion}
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading
              ? "Starting..."
              : fileSize
                ? `Download (${formatBytes(fileSize)})`
                : "Download"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {publishedAt && (
          <p className="text-xs text-muted-foreground">
            Released {new Date(publishedAt).toLocaleDateString()}
          </p>
        )}

        {releaseNotes && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-0 text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="mr-2 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              Release Notes
            </Button>
            {expanded && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap border-l-2 pl-3">
                {releaseNotes}
              </div>
            )}
          </>
        )}

        <a
          href={changelogUrl}
          className="inline-flex items-center text-xs text-primary hover:underline"
        >
          View full changelog
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
}
