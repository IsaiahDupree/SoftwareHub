"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useRealtimeSubscription(
  table: string,
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
  filter?: string
) {
  useEffect(() => {
    let channel: RealtimeChannel;

    const subscribe = () => {
      const channelConfig = supabase
        .channel(`realtime:${table}`)
        .on(
          "postgres_changes" as any,
          {
            event: "*",
            schema: "public",
            table,
            ...(filter ? { filter } : {}),
          },
          (payload: any) => {
            callback({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        );

      channel = channelConfig.subscribe();
    };

    subscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [table, filter, callback]);
}
