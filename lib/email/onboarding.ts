import { resend, RESEND_FROM } from './resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:2828';

/**
 * Send welcome email sequence for new course enrollment.
 * Gracefully handles Resend not being configured.
 */
export async function sendWelcomeEmail(params: {
  userEmail: string;
  userName: string | null;
  courseName: string;
  courseSlug: string;
  firstLessonId: string | null;
}): Promise<void> {
  const { userEmail, userName, courseName, courseSlug, firstLessonId } = params;

  const courseUrl = `${SITE_URL}/app/courses/${courseSlug}`;
  const firstLessonUrl =
    firstLessonId ? `${SITE_URL}/app/courses/${courseSlug}/lessons/${firstLessonId}` : courseUrl;

  const firstName = userName ? userName.split(' ')[0] : null;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  const subject = `You're enrolled: ${courseName}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
        <h2 style="color: #111;">${greeting}</h2>
        <p>Welcome to <strong>${courseName}</strong>! You're all set to start learning.</p>
        <p>
          <a
            href="${firstLessonUrl}"
            style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;"
          >
            Start Learning &rarr;
          </a>
        </p>
        <p style="color: #555; font-size: 14px;">
          Or visit your course dashboard: <a href="${courseUrl}">${courseUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">
          You received this email because you enrolled in <strong>${courseName}</strong>.
        </p>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: RESEND_FROM,
      to: [userEmail],
      subject,
      html: htmlBody,
    });
  } catch (error) {
    // Gracefully handle Resend not configured or send failures
    console.error('[onboarding] Failed to send welcome email:', error);
  }
}

/**
 * Send getting started checklist email.
 * Gracefully handles Resend not being configured.
 */
export async function sendGettingStartedEmail(params: {
  userEmail: string;
  userName: string | null;
  courseName: string;
  checklistItems: string[];
}): Promise<void> {
  const { userEmail, userName, courseName, checklistItems } = params;

  const firstName = userName ? userName.split(' ')[0] : null;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  const subject = `Getting started with ${courseName}`;

  const checklistHtml = checklistItems
    .map(
      (item) =>
        `<li style="margin-bottom: 8px; padding-left: 4px;">&#10003; ${item}</li>`
    )
    .join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
        <h2 style="color: #111;">${greeting}</h2>
        <p>Here is your getting started checklist for <strong>${courseName}</strong>:</p>
        ${
          checklistItems.length > 0
            ? `<ul style="list-style: none; padding: 0; margin: 16px 0;">
                ${checklistHtml}
               </ul>`
            : '<p style="color: #555;">Follow along with the course curriculum to get the most out of your learning.</p>'
        }
        <p style="color: #555; font-size: 14px; margin-top: 24px;">
          Happy learning!
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">
          You received this email because you enrolled in <strong>${courseName}</strong>.
        </p>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: RESEND_FROM,
      to: [userEmail],
      subject,
      html: htmlBody,
    });
  } catch (error) {
    // Gracefully handle Resend not configured or send failures
    console.error('[onboarding] Failed to send getting started email:', error);
  }
}
