import { resend, RESEND_FROM } from "./resend";
import { NewReleaseEmail } from "@/components/emails/NewReleaseEmail";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendNewReleaseEmail(args: {
  to: string;
  firstName?: string;
  packageName: string;
  packageSlug: string;
  version: string;
  releaseNotes: string;
  channel: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const downloadUrl = `${siteUrl}/app/downloads`;
  const changelogUrl = `${siteUrl}/app/packages/${args.packageSlug}/changelog`;
  const subject = `${args.packageName} v${args.version} is now available`;

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [args.to],
    subject,
    react: NewReleaseEmail({
      firstName: args.firstName,
      packageName: args.packageName,
      version: args.version,
      releaseNotes: args.releaseNotes,
      downloadUrl,
      changelogUrl,
      channel: args.channel,
    }),
  });

  // Log the send attempt
  await supabaseAdmin.from("email_sends").insert({
    email: args.to,
    template: "new_release",
    resend_email_id: data?.id ?? null,
    subject,
    metadata: { packageName: args.packageName, version: args.version },
    status: error ? "failed" : "sent",
    error_message: error ? JSON.stringify(error) : null,
  });

  if (error) throw new Error(JSON.stringify(error));
  return data;
}

/**
 * Send new release emails to all users with entitlement for a package.
 * Respects notification preferences.
 */
export async function notifyUsersOfNewRelease(args: {
  packageId: string;
  packageName: string;
  packageSlug: string;
  version: string;
  releaseNotes: string;
  channel: string;
}) {
  // Get all users with entitlement for this package
  const { data: entitlements } = await supabaseAdmin
    .from("package_entitlements")
    .select("user_id")
    .eq("package_id", args.packageId)
    .eq("has_access", true);

  if (!entitlements || entitlements.length === 0) return { sent: 0 };

  const userIds = entitlements.map((e) => e.user_id);

  // Get user details and notification preferences
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);

  if (!users || users.length === 0) return { sent: 0 };

  // Get notification preferences for these users
  const { data: prefs } = await supabaseAdmin
    .from("notification_preferences")
    .select("user_id, email_on_new_release")
    .in("user_id", userIds);

  const prefsMap = new Map(
    (prefs ?? []).map((p) => [p.user_id, p.email_on_new_release])
  );

  let sent = 0;
  for (const user of users) {
    // Default to true if no preference set
    const wantsEmail = prefsMap.get(user.id) ?? true;
    if (!wantsEmail || !user.email) continue;

    try {
      await sendNewReleaseEmail({
        to: user.email,
        firstName: user.full_name?.split(" ")[0],
        packageName: args.packageName,
        packageSlug: args.packageSlug,
        version: args.version,
        releaseNotes: args.releaseNotes,
        channel: args.channel,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send release email to ${user.email}:`, err);
    }
  }

  return { sent };
}
