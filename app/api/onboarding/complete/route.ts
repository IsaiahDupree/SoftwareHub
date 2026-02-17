// Onboarding Complete API
// ONBOARD-001: Mark onboarding complete and send getting-started email

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendGettingStartedEmail } from '@/lib/email/onboarding';

const completeSchema = z.object({
  courseId: z.string().uuid(),
});

const DEFAULT_CHECKLIST = [
  'Complete your profile so instructors can get to know you',
  'Watch the first lesson to get an overview of the course',
  'Join the community and introduce yourself',
  'Set a weekly learning goal and schedule time on your calendar',
  'Download any course resources or supplementary materials',
];

// POST /api/onboarding/complete - Mark onboarding complete and send getting-started email
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = completeSchema.parse(body);
    const { courseId } = validated;

    // Verify the user is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError) {
      console.error('Error checking enrollment:', enrollmentError);
      return NextResponse.json({ error: 'Failed to verify enrollment' }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get course details for the email
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, slug')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get user email from users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .maybeSingle();

    // Get display name from profiles table
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    const userEmail = userRecord?.email ?? user.email ?? '';
    const userName = userProfile?.display_name ?? null;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Send getting started email (fire-and-forget - errors handled inside)
    await sendGettingStartedEmail({
      userEmail,
      userName,
      courseName: course.title,
      checklistItems: DEFAULT_CHECKLIST,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/onboarding/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
