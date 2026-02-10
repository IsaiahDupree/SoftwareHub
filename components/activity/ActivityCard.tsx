"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  AlertTriangle,
  Megaphone,
  CheckCircle,
  XCircle,
  Package,
  Pin,
  ArrowRight,
} from "lucide-react";

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

const typeIcons: Record<string, typeof Rocket> = {
  release: Rocket,
  status_change: AlertTriangle,
  announcement: Megaphone,
  maintenance: AlertTriangle,
  new_package: Package,
  status_up: CheckCircle,
  status_down: XCircle,
};

const typeBadgeColors: Record<string, string> = {
  release: "bg-blue-100 text-blue-800",
  status_change: "bg-yellow-100 text-yellow-800",
  announcement: "bg-purple-100 text-purple-800",
  maintenance: "bg-orange-100 text-orange-800",
  new_package: "bg-green-100 text-green-800",
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ActivityCard({ item }: { item: ActivityItem }) {
  const Icon = typeIcons[item.type] || Package;

  return (
    <Card className={item.is_pinned ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="py-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {item.is_pinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
              <h3 className="text-sm font-medium truncate">{item.title}</h3>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${typeBadgeColors[item.type] || "bg-gray-100 text-gray-800"}`}>
                {item.type.replace(/_/g, " ")}
              </span>
            </div>

            {item.packages && (
              <p className="text-xs text-muted-foreground mb-1">
                {item.packages.name}
              </p>
            )}

            {item.body && (
              <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {item.body}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {timeAgo(item.created_at)}
              </span>
              {item.action_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={item.action_url}>
                    {item.action_label || "View"}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
