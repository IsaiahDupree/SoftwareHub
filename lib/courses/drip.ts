// lib/courses/drip.ts
// Drip course content scheduling logic
// INT-003

import type { SupabaseClient } from '@supabase/supabase-js';

export type DripType = 'days_after_enrollment' | 'fixed_date' | null;

export interface LessonWithDrip {
  id: string;
  title: string;
  drip_type: DripType;
  drip_value: string | number | null;
  is_preview: boolean;
}

/**
 * Determine whether a lesson is unlocked for a user based on drip settings.
 *
 * @param lesson       - Lesson record with drip fields
 * @param enrolledAt   - Date/time when user enrolled in the course (entitlement.granted_at)
 * @param now          - Current time (defaults to Date.now(), injectable for testing)
 */
export function isLessonUnlocked(
  lesson: LessonWithDrip,
  enrolledAt: Date,
  now: Date = new Date()
): boolean {
  // Preview lessons are always unlocked
  if (lesson.is_preview) return true;

  // No drip config = immediately available
  if (!lesson.drip_type || lesson.drip_value === null || lesson.drip_value === undefined) {
    return true;
  }

  if (lesson.drip_type === 'days_after_enrollment') {
    const days = typeof lesson.drip_value === 'string'
      ? parseInt(lesson.drip_value, 10)
      : lesson.drip_value as number;

    if (isNaN(days)) return true;

    const unlockAt = new Date(enrolledAt.getTime() + days * 24 * 60 * 60 * 1000);
    return now >= unlockAt;
  }

  if (lesson.drip_type === 'fixed_date') {
    const unlockAt = new Date(lesson.drip_value as string);
    if (isNaN(unlockAt.getTime())) return true;
    return now >= unlockAt;
  }

  return true;
}

/**
 * Get the unlock date for a lesson.
 * Returns null if the lesson has no drip or is already unlocked.
 */
export function getLessonUnlockDate(
  lesson: LessonWithDrip,
  enrolledAt: Date
): Date | null {
  if (!lesson.drip_type || lesson.drip_value === null || lesson.drip_value === undefined) {
    return null;
  }

  if (lesson.drip_type === 'days_after_enrollment') {
    const days = typeof lesson.drip_value === 'string'
      ? parseInt(lesson.drip_value, 10)
      : lesson.drip_value as number;

    if (isNaN(days)) return null;

    return new Date(enrolledAt.getTime() + days * 24 * 60 * 60 * 1000);
  }

  if (lesson.drip_type === 'fixed_date') {
    const d = new Date(lesson.drip_value as string);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Fetch all lessons for a course with their drip unlock status for a given user.
 * Uses supabase server client.
 */
export async function getCourseWithDripStatus(
  supabase: SupabaseClient,
  courseId: string,
  userId: string
): Promise<{
  lessons: (LessonWithDrip & { unlocked: boolean; unlocks_at: string | null })[];
  enrolled_at: string | null;
}> {
  // Get enrollment date
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('granted_at')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const enrolledAt = entitlement?.granted_at ? new Date(entitlement.granted_at) : new Date();

  // Get all lessons with drip info
  const { data: chapters } = await supabase
    .from('chapters')
    .select(`
      id,
      position,
      lessons:lessons (
        id,
        title,
        drip_type,
        drip_value,
        is_preview,
        position
      )
    `)
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  const now = new Date();
  const lessonsWithStatus = (chapters ?? [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .flatMap((chapter: { lessons: LessonWithDrip[] }) => chapter.lessons ?? [])
    .sort((a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0))
    .map((lesson: LessonWithDrip) => {
      const unlocked = isLessonUnlocked(lesson, enrolledAt, now);
      const unlockDate = getLessonUnlockDate(lesson, enrolledAt);

      return {
        ...lesson,
        unlocked,
        unlocks_at: unlocked ? null : (unlockDate?.toISOString() ?? null),
      };
    });

  return {
    lessons: lessonsWithStatus,
    enrolled_at: entitlement?.granted_at ?? null,
  };
}

/**
 * Find lessons that become unlocked "today" for a user (for drip emails).
 * Used by the cron job.
 */
export function getLessonsUnlockingToday(
  lessons: LessonWithDrip[],
  enrolledAt: Date,
  windowHours = 24
): LessonWithDrip[] {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  return lessons.filter((lesson) => {
    const unlockDate = getLessonUnlockDate(lesson, enrolledAt);
    if (!unlockDate) return false;

    // Unlocked within the last `windowHours`
    return unlockDate >= windowStart && unlockDate <= now;
  });
}
