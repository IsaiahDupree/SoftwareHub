"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldOff, ShieldCheck, Save } from "lucide-react";

export function LicenseActions({
  licenseId,
  currentStatus,
  maxDevices,
  expiresAt,
}: {
  licenseId: string;
  currentStatus: string;
  maxDevices: number;
  expiresAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState(maxDevices);
  const [expires, setExpires] = useState(expiresAt ? expiresAt.split("T")[0] : "");

  async function updateLicense(data: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Status Actions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Status</p>
        <div className="flex flex-col gap-2">
          {currentStatus !== "active" && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => updateLicense({ status: "active" })}
              className="justify-start"
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
              Reactivate
            </Button>
          )}
          {currentStatus !== "suspended" && currentStatus !== "revoked" && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => updateLicense({ status: "suspended" })}
              className="justify-start"
            >
              <ShieldAlert className="mr-2 h-4 w-4 text-yellow-600" />
              Suspend
            </Button>
          )}
          {currentStatus !== "revoked" && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                if (confirm("Are you sure you want to revoke this license? This will prevent the user from using the software.")) {
                  updateLicense({ status: "revoked" });
                }
              }}
              className="justify-start text-red-600 hover:text-red-700"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke
            </Button>
          )}
        </div>
      </div>

      {/* Device Limit */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Max Devices
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={devices}
            onChange={(e) => setDevices(parseInt(e.target.value) || 0)}
            className="w-20 border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          {devices !== maxDevices && (
            <Button
              size="sm"
              disabled={loading}
              onClick={() => updateLicense({ max_devices: devices })}
            >
              <Save className="mr-1 h-3 w-3" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Expiration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Expiration Date
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          <Button
            size="sm"
            disabled={loading}
            onClick={() =>
              updateLicense({
                expires_at: expires ? new Date(expires).toISOString() : null,
              })
            }
          >
            <Save className="mr-1 h-3 w-3" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
