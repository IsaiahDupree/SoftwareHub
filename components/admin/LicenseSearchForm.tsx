"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function LicenseSearchForm({
  currentStatus,
  currentSearch,
}: {
  currentStatus?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch || "");
  const [status, setStatus] = useState(currentStatus || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    router.push(`/admin/licenses${params.toString() ? `?${params}` : ""}`);
  }

  function handleClear() {
    setSearch("");
    setStatus("");
    router.push("/admin/licenses");
  }

  const statuses = ["active", "suspended", "revoked", "expired"];

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by email or license key..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border rounded-md px-3 py-2 bg-background text-sm"
      >
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm">
        Filter
      </Button>
      {(currentSearch || currentStatus) && (
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </form>
  );
}
