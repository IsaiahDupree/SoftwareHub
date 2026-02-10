"use client";

import Link from "next/link";

interface PackageRevenueRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  users: number;
  estimated_revenue: number;
}

interface PackageRevenueTableProps {
  packages: PackageRevenueRow[];
}

export function PackageRevenueTable({ packages }: PackageRevenueTableProps) {
  if (packages.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No package sales yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {packages.map((pkg, idx) => (
        <div key={pkg.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
              #{idx + 1}
            </span>
            <div>
              <Link
                href={`/admin/packages/${pkg.id}`}
                className="text-sm font-medium hover:underline"
              >
                {pkg.name}
              </Link>
              <p className="text-xs text-muted-foreground">{pkg.users} users</p>
            </div>
          </div>
          <span className="text-sm font-semibold">
            ${(pkg.estimated_revenue / 100).toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
}
