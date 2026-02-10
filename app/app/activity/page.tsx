"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { Loader2 } from "lucide-react";

const TYPES = [
  { label: "All", value: "" },
  { label: "Releases", value: "release" },
  { label: "Status", value: "status_change" },
  { label: "Announcements", value: "announcement" },
];

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_pinned: boolean;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  packages: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  } | null;
}

export default function ActivityFeedPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("");

  const fetchItems = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (!reset && cursor) params.set("cursor", cursor);
        if (activeType) params.set("type", activeType);
        params.set("limit", "20");

        const res = await fetch(`/api/activity?${params}`);
        if (!res.ok) return;
        const data = await res.json();

        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setCursor(data.next_cursor);
        setHasMore(data.has_more);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    },
    [cursor, activeType]
  );

  useEffect(() => {
    setCursor(null);
    setItems([]);
    setHasMore(true);
    // Trigger fetch with reset
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeType) params.set("type", activeType);
        params.set("limit", "20");

        const res = await fetch(`/api/activity?${params}`);
        if (!res.ok) return;
        const data = await res.json();

        setItems(data.items);
        setCursor(data.next_cursor);
        setHasMore(data.has_more);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [activeType]);

  // Pinned items shown at top
  const pinnedItems = items.filter((i) => i.is_pinned);
  const regularItems = items.filter((i) => !i.is_pinned);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        description="Latest updates from your software packages"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <Button
            key={t.value}
            variant={activeType === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveType(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Pinned Section */}
      {pinnedItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Pinned</h2>
          {pinnedItems.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Regular Feed */}
      <div className="space-y-3">
        {regularItems.map((item) => (
          <ActivityCard key={item.id} item={item} />
        ))}
      </div>

      {/* Load More / Loading */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchItems()}>
            Load more
          </Button>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No activity yet
        </div>
      )}
    </div>
  );
}
