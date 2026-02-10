import { resend, RESEND_FROM } from "./resend";
import { LicenseExpirationEmail } from "@/components/emails/LicenseExpirationEmail";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendLicenseExpirationEmail(args: {
  to: string;
  firstName?: string;
  packageName: string;
  expiresAt: string;
  daysRemaining: number;
  activeDevices: number;
  maxDevices: number;
}) {
  const licensesUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/licenses`;
  const subject = `Your ${args.packageName} license expires in ${args.daysRemaining} day${args.daysRemaining !== 1 ? "s" : ""}`;

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [args.to],
    subject,
    react: LicenseExpirationEmail({
      firstName: args.firstName,
      packageName: args.packageName,
      expiresAt: args.expiresAt,
      daysRemaining: args.daysRemaining,
      activeDevices: args.activeDevices,
      maxDevices: args.maxDevices,
      licensesUrl,
    }),
  });

  // Log the send attempt
  await supabaseAdmin.from("email_sends").insert({
    email: args.to,
    template: "license_expiration",
    resend_email_id: data?.id ?? null,
    subject,
    metadata: { packageName: args.packageName, daysRemaining: args.daysRemaining },
    status: error ? "failed" : "sent",
    error_message: error ? JSON.stringify(error) : null,
  });

  if (error) throw new Error(JSON.stringify(error));
  return data;
}
