/**
 * User Data Export (WR-WC-045)
 *
 * GDPR/CCPA-compliant endpoint that returns a full export of all personal
 * data held for the authenticated user. The response can be downloaded as
 * a JSON file by the client.
 *
 * GET /api/user/data-export
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/security/audit-log";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all personal data held for this user in parallel
  const [profile, progress, orders, notifications] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("lesson_progress").select("*").eq("user_id", user.id),
    supabase.from("orders").select("*").eq("user_id", user.id),
    supabase.from("notifications").select("*").eq("user_id", user.id),
  ]);

  auditLog({
    event: "data.export",
    userId: user.id,
    details: { reason: "user_request" },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile.data,
    progress: progress.data,
    orders: orders.data,
    notifications: notifications.data,
    exported_at: new Date().toISOString(),
  });
}
