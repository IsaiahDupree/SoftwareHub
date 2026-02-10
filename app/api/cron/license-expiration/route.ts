import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendLicenseExpirationEmail } from "@/lib/email/sendLicenseExpirationEmail";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find active licenses expiring within 7 days that haven't been notified
    const { data: expiringLicenses } = await supabaseAdmin
      .from("licenses")
      .select(`
        id,
        user_id,
        package_id,
        expires_at,
        max_devices,
        status
      `)
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lte("expires_at", sevenDaysFromNow.toISOString())
      .gte("expires_at", now.toISOString());

    if (!expiringLicenses || expiringLicenses.length === 0) {
      return NextResponse.json({ message: "No expiring licenses", sent: 0 });
    }

    // Check which ones we've already notified (check email_sends for recent license_expiration emails)
    const licenseIds = expiringLicenses.map((l) => l.id);
    const { data: recentSends } = await supabaseAdmin
      .from("email_sends")
      .select("metadata")
      .eq("template", "license_expiration")
      .gte("created_at", new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString());

    const alreadyNotifiedLicenseIds = new Set(
      (recentSends ?? [])
        .map((s) => (s.metadata as Record<string, string>)?.licenseId)
        .filter(Boolean)
    );

    const licensesToNotify = expiringLicenses.filter(
      (l) => !alreadyNotifiedLicenseIds.has(l.id)
    );

    // Get user and package details
    const userIds = [...new Set(licensesToNotify.map((l) => l.user_id))];
    const packageIds = [...new Set(licensesToNotify.map((l) => l.package_id))];

    const [usersResult, packagesResult, prefsResult] = await Promise.all([
      supabaseAdmin.from("users").select("id, email, full_name").in("id", userIds),
      supabaseAdmin.from("packages").select("id, name").in("id", packageIds),
      supabaseAdmin
        .from("notification_preferences")
        .select("user_id, email_on_license_expiration")
        .in("user_id", userIds),
    ]);

    const usersMap = new Map(
      (usersResult.data ?? []).map((u) => [u.id, u])
    );
    const packagesMap = new Map(
      (packagesResult.data ?? []).map((p) => [p.id, p])
    );
    const prefsMap = new Map(
      (prefsResult.data ?? []).map((p) => [p.user_id, p.email_on_license_expiration])
    );

    let sent = 0;
    for (const license of licensesToNotify) {
      const user = usersMap.get(license.user_id);
      const pkg = packagesMap.get(license.package_id);
      const wantsEmail = prefsMap.get(license.user_id) ?? true;

      if (!user?.email || !pkg || !wantsEmail) continue;

      const expiresAt = new Date(license.expires_at!);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Count active devices
      const { count: activeDevices } = await supabaseAdmin
        .from("device_activations")
        .select("id", { count: "exact", head: true })
        .eq("license_id", license.id)
        .eq("is_active", true);

      try {
        await sendLicenseExpirationEmail({
          to: user.email,
          firstName: user.full_name?.split(" ")[0],
          packageName: pkg.name,
          expiresAt: license.expires_at!,
          daysRemaining,
          activeDevices: activeDevices ?? 0,
          maxDevices: license.max_devices,
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send expiration email for license ${license.id}:`, err);
      }
    }

    return NextResponse.json({
      message: `Processed ${licensesToNotify.length} expiring licenses`,
      sent,
    });
  } catch (err) {
    console.error("License expiration cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
