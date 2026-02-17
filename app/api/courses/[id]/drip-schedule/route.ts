// app/api/courses/[id]/drip-schedule/route.ts
// Returns the drip unlock schedule for a course, specific to the authenticated user.
// INT-003

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getCourseWithDripStatus } from '@/lib/courses/drip';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user has access to the course
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('id, status')
    .eq('course_id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!entitlement) {
    return NextResponse.json({ error: 'No access to this course' }, { status: 403 });
  }

  try {
    const dripStatus = await getCourseWithDripStatus(supabase, params.id, user.id);

    const unlockedCount = dripStatus.lessons.filter((l) => l.unlocked).length;
    const lockedCount = dripStatus.lessons.filter((l) => !l.unlocked).length;

    const nextUnlock = dripStatus.lessons
      .filter((l) => !l.unlocked && l.unlocks_at)
      .sort((a, b) => new Date(a.unlocks_at!).getTime() - new Date(b.unlocks_at!).getTime())[0];

    return NextResponse.json({
      enrolled_at: dripStatus.enrolled_at,
      lessons: dripStatus.lessons,
      summary: {
        total: dripStatus.lessons.length,
        unlocked: unlockedCount,
        locked: lockedCount,
        next_unlock: nextUnlock
          ? { lesson_id: nextUnlock.id, unlocks_at: nextUnlock.unlocks_at }
          : null,
      },
    });
  } catch (err) {
    console.error('Error fetching drip schedule:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
