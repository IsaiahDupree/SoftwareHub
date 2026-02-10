import { resend, RESEND_FROM } from "./resend";
import { PackagePurchaseEmail } from "@/components/emails/PackagePurchaseEmail";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendPackagePurchaseEmail(args: {
  to: string;
  firstName?: string;
  packageName: string;
  licenseKey: string;
  licenseType: string;
  maxDevices: number;
}) {
  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/downloads`;
  const subject = `Your license for ${args.packageName}`;

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [args.to],
    subject,
    react: PackagePurchaseEmail({
      firstName: args.firstName,
      packageName: args.packageName,
      licenseKey: args.licenseKey,
      downloadUrl,
      licenseType: args.licenseType,
      maxDevices: args.maxDevices,
    }),
  });

  // Log the send attempt
  await supabaseAdmin.from("email_sends").insert({
    email: args.to,
    template: "package_purchase",
    resend_email_id: data?.id ?? null,
    subject,
    metadata: { packageName: args.packageName },
    status: error ? "failed" : "sent",
    error_message: error ? JSON.stringify(error) : null,
  });

  if (error) throw new Error(JSON.stringify(error));
  return data;
}
