"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface PackageStatus {
  package_id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  type: string;
  status: string;
  last_check: {
    status: string;
    response_time_ms: number | null;
    checked_at: string;
    message: string | null;
  } | null;
}

interface StatusDashboardProps {
  packages: PackageStatus[];
  overallStatus: string;
}

const statusDotColors: Record<string, string> = {
  operational: "bg-green-500",
  degraded: "bg-yellow-500",
  down: "bg-red-500",
  maintenance: "bg-blue-500",
};

const overallStatusText: Record<string, string> = {
  operational: "All Systems Operational",
  partial_outage: "Partial System Outage",
  major_outage: "Major System Outage",
  maintenance: "Maintenance in Progress",
};

const overallStatusColors: Record<string, string> = {
  operational: "bg-green-50 text-green-800 border-green-200",
  partial_outage: "bg-yellow-50 text-yellow-800 border-yellow-200",
  major_outage: "bg-red-50 text-red-800 border-red-200",
  maintenance: "bg-blue-50 text-blue-800 border-blue-200",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function StatusDashboard({ packages, overallStatus }: StatusDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Overall Status Banner */}
      <div
        className={`rounded-lg border p-4 text-center font-medium ${
          overallStatusColors[overallStatus] || overallStatusColors.operational
        }`}
      >
        {overallStatusText[overallStatus] || "Status Unknown"}
      </div>

      {/* Package Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {packages.map((pkg) => (
              <div
                key={pkg.package_id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {pkg.icon_url ? (
                    <img
                      src={pkg.icon_url}
                      alt={pkg.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{pkg.name}</p>
                    {pkg.last_check && (
                      <p className="text-xs text-muted-foreground">
                        {pkg.last_check.response_time_ms
                          ? `${pkg.last_check.response_time_ms}ms`
                          : ""}
                        {pkg.last_check.checked_at &&
                          ` · Checked ${timeAgo(pkg.last_check.checked_at)}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground capitalize">
                    {pkg.status}
                  </span>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      statusDotColors[pkg.status] || "bg-gray-400"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
