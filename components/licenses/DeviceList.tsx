"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Laptop, Trash2 } from "lucide-react";

interface DeviceActivation {
  id: string;
  device_name: string | null;
  device_type: string | null;
  os_name: string | null;
  os_version: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  laptop: Laptop,
};

export function DeviceList({
  devices,
  licenseId,
}: {
  devices: DeviceActivation[];
  licenseId: string;
}) {
  const router = useRouter();
  const [deactivating, setDeactivating] = useState<string | null>(null);

  async function handleDeactivate(deviceId: string) {
    if (!confirm("Are you sure you want to deactivate this device?")) return;

    setDeactivating(deviceId);
    try {
      const res = await fetch("/api/licenses/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_id: licenseId,
          device_id: deviceId,
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setDeactivating(null);
    }
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No devices activated yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => {
        const DeviceIcon = deviceIcons[device.device_type || ""] || Monitor;
        return (
          <div
            key={device.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <DeviceIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {device.device_name || "Unknown device"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[device.os_name, device.os_version].filter(Boolean).join(" ")}
                  {device.last_seen_at && (
                    <> &middot; Last seen {new Date(device.last_seen_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={device.is_active ? "default" : "secondary"}>
                {device.is_active ? "Active" : "Inactive"}
              </Badge>
              {device.is_active && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  disabled={deactivating === device.id}
                  onClick={() => handleDeactivate(device.id)}
                  title="Deactivate device"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
