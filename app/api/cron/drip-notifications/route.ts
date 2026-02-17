// app/api/cron/drip-notifications/route.ts
// Cron job: send email notifications when drip lessons unlock.
// Run daily via Vercel Cron (see vercel.json).
// INT-003

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getLessonsUnlockingToday } from '@/lib/courses/drip';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Find all active entitlements for courses that have drip lessons
    const { data: entitlements } = await supabaseAdmin
      .from('entitlements')
      .select(`
        id,
        user_id,
        course_id,
        granted_at,
        users:user_id (email, full_name),
        courses:course_id (title, slug)
      `)
      .eq('status', 'active');

    if (!entitlements || entitlements.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, message: 'No active entitlements' });
    }

    for (const entitlement of entitlements) {
      try {
        const user = entitlement.users as { email: string; full_name: string | null } | null;
        const course = entitlement.courses as { title: string; slug: string } | null;

        if (!user?.email || !course || !entitlement.granted_at) continue;

        // Get drip lessons for this course
        const { data: chapters } = await supabaseAdmin
          .from('chapters')
          .select(`
            lessons:lessons (
              id,
              title,
              drip_type,
              drip_value,
              is_preview
            )
          `)
          .eq('course_id', entitlement.course_id);

        const allLessons = (chapters ?? []).flatMap(
          (ch: { lessons: unknown[] }) => ch.lessons ?? []
        );

        if (allLessons.length === 0) continue;

        const enrolledAt = new Date(entitlement.granted_at);
        const unlockingToday = getLessonsUnlockingToday(
          allLessons as Parameters<typeof getLessonsUnlockingToday>[0],
          enrolledAt
        );

        if (unlockingToday.length === 0) continue;

        // Send drip notification email
        const lessonList = unlockingToday
          .map((l) => `• ${l.title}`)
          .join('\n');

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://softwarehub.app';

        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'SoftwareHub <no-reply@softwarehub.app>',
          to: user.email,
          subject: `New content unlocked in "${course.title}"`,
          text: [
            `Hi ${user.full_name ?? 'there'},`,
            '',
            `Great news! New content has just unlocked in your course "${course.title}":`,
            '',
            lessonList,
            '',
            `Start learning now: ${siteUrl}/app/courses/${course.slug}`,
            '',
            'Happy learning,',
            'The SoftwareHub Team',
          ].join('\n'),
        });

        sent++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`entitlement ${entitlement.id}: ${msg}`);
        console.error('[drip-notifications] Error processing entitlement:', err);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[drip-notifications] Fatal error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
