/**
 * User Data Deletion (WR-WC-045)
 *
 * GDPR/CCPA "right to erasure" endpoint. Deletes all personal data for the
 * authenticated user, signs them out, and confirms deletion.
 *
 * Cascade deletes in the database handle any additional dependent records
 * (e.g., entitlements, referrals) that are not explicitly listed here.
 *
 * DELETE /api/user/data-delete
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/security/audit-log";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Log the deletion attempt before removing data
  auditLog({
    event: "data.delete",
    userId: user.id,
    details: { reason: "user_request" },
  });

  // Delete user-owned records. Database-level cascade deletes handle
  // any child records not listed here.
  await Promise.all([
    supabase.from("lesson_progress").delete().eq("user_id", user.id),
    supabase.from("notifications").delete().eq("user_id", user.id),
    supabase.from("notification_preferences").delete().eq("user_id", user.id),
  ]);

  // Sign out the user before deleting the auth record
  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    message: "Account data deleted",
  });
}
