"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { LicenseKey } from "./LicenseKey";
import { DeviceList } from "./DeviceList";

interface LicenseData {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  active_devices: number;
  max_devices: number;
  expires_at: string | null;
  created_at: string;
  packages: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  } | null;
  device_activations: Array<{
    id: string;
    device_name: string | null;
    device_type: string | null;
    os_name: string | null;
    os_version: string | null;
    is_active: boolean;
    last_seen_at: string | null;
    created_at: string;
  }>;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-yellow-100 text-yellow-800",
  revoked: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

export function LicenseCard({ license }: { license: LicenseData }) {
  const [expanded, setExpanded] = useState(false);

  const pkg = license.packages;
  const activeDevices = license.device_activations?.filter((d) => d.is_active) || [];
  const deviceUsage = license.max_devices > 0
    ? Math.round((license.active_devices / license.max_devices) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {pkg?.icon_url ? (
              <img
                src={pkg.icon_url}
                alt={pkg.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">
                {pkg?.name || "Unknown Package"}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[license.status] || "bg-gray-100 text-gray-800"}`}>
                  {license.status}
                </span>
                <Badge variant="outline" className="text-xs">
                  {license.license_type}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* License Key */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">License Key</p>
          <LicenseKey licenseId={license.id} maskedKey={license.license_key} />
        </div>

        {/* Device Count Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Devices</span>
            <span>{license.active_devices} / {license.max_devices}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                deviceUsage > 80 ? "bg-orange-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(deviceUsage, 100)}%` }}
            />
          </div>
        </div>

        {/* Expiration */}
        {license.expires_at && (
          <div className="text-xs text-muted-foreground">
            Expires: {new Date(license.expires_at).toLocaleDateString()}
          </div>
        )}

        {/* Expand Devices */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Hide Devices
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Show Devices ({activeDevices.length})
            </>
          )}
        </Button>

        {expanded && (
          <DeviceList
            devices={license.device_activations || []}
            licenseId={license.id}
          />
        )}
      </CardContent>
    </Card>
  );
}
