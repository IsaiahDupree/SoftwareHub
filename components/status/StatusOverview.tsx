"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface StatusData {
  overall_status: string;
  packages: Array<{
    package_id: string;
    name: string;
    status: string;
  }>;
}

export function StatusOverview() {
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          setStatus(await res.json());
        }
      } catch {
        // Silently fail
      }
    }
    fetchStatus();
  }, []);

  if (!status) return null;

  const degradedPackages = status.packages.filter(
    (p) => p.status !== "operational"
  );
  const isAllGood = degradedPackages.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isAllGood ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAllGood ? (
          <p className="text-sm text-green-700">All systems operational</p>
        ) : (
          <div className="space-y-1">
            {degradedPackages.map((pkg) => (
              <p key={pkg.package_id} className="text-sm text-yellow-700">
                {pkg.name}: <span className="capitalize">{pkg.status}</span>
              </p>
            ))}
          </div>
        )}
        <Link
          href="/app/activity"
          className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
        >
          View full status
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
