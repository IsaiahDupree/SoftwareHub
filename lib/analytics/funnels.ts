import { createClient } from "@/lib/supabase/client";

export interface FunnelStep {
  name: string;
  count: number;
  conversionRate: number;
}

export async function getCheckoutFunnel(dateRange?: { from: string; to: string }): Promise<FunnelStep[]> {
  const supabase = createClient();

  const [pageViews, checkoutStarts, completedOrders] = await Promise.all([
    supabase.from("activity_feed").select("id", { count: "exact" }).eq("action", "page_view"),
    supabase.from("activity_feed").select("id", { count: "exact" }).eq("action", "checkout_start"),
    supabase.from("orders").select("id", { count: "exact" }).eq("status", "completed"),
  ]);

  const steps = [
    { name: "Page Views", count: pageViews.count || 0 },
    { name: "Checkout Started", count: checkoutStarts.count || 0 },
    { name: "Purchase Complete", count: completedOrders.count || 0 },
  ];

  return steps.map((step, i) => ({
    ...step,
    conversionRate: i === 0 ? 100 : steps[0].count > 0 ? (step.count / steps[0].count) * 100 : 0,
  }));
}
