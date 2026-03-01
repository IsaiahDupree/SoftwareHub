import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [users, orders, courses] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }),
    supabase.from("orders").select("id, amount", { count: "exact" }).eq("status", "completed"),
    supabase.from("courses").select("id", { count: "exact" }).eq("published", true),
  ]);

  const totalRevenue = (orders.data || []).reduce((sum: number, o: { amount?: number }) => sum + (o.amount || 0), 0);

  return NextResponse.json({
    totalUsers: users.count || 0,
    totalOrders: orders.count || 0,
    totalRevenue,
    totalCourses: courses.count || 0,
    updatedAt: new Date().toISOString(),
  });
}
