import { resend, RESEND_FROM } from "./resend";

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  return resend.emails.send({
    from: RESEND_FROM,
    to: email,
    subject: "Reset your password - SoftwareHub",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">SoftwareHub</p>
      </div>
    `,
  });
}
