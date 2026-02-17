// __tests__/lib/courses/drip.test.ts
// Unit tests for drip course content scheduling
// INT-003

import { describe, it, expect } from '@jest/globals';
import {
  isLessonUnlocked,
  getLessonUnlockDate,
  getLessonsUnlockingToday,
  type LessonWithDrip,
} from '@/lib/courses/drip';

function makeDripLesson(overrides: Partial<LessonWithDrip>): LessonWithDrip {
  return {
    id: 'lesson-1',
    title: 'Test Lesson',
    drip_type: null,
    drip_value: null,
    is_preview: false,
    ...overrides,
  };
}

describe('isLessonUnlocked', () => {
  const enrolledAt = new Date('2026-01-01T00:00:00Z');

  it('unlocks immediately when no drip config', () => {
    const lesson = makeDripLesson({ drip_type: null, drip_value: null });
    expect(isLessonUnlocked(lesson, enrolledAt)).toBe(true);
  });

  it('always unlocks preview lessons', () => {
    const lesson = makeDripLesson({
      drip_type: 'days_after_enrollment',
      drip_value: 30,
      is_preview: true,
    });
    expect(isLessonUnlocked(lesson, enrolledAt)).toBe(true);
  });

  describe('days_after_enrollment', () => {
    it('unlocks lesson after specified days', () => {
      const lesson = makeDripLesson({ drip_type: 'days_after_enrollment', drip_value: 7 });
      const now = new Date('2026-01-09T00:00:00Z'); // 8 days after enrollment
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(true);
    });

    it('locks lesson before specified days', () => {
      const lesson = makeDripLesson({ drip_type: 'days_after_enrollment', drip_value: 7 });
      const now = new Date('2026-01-05T00:00:00Z'); // 4 days after enrollment
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(false);
    });

    it('unlocks exactly on the unlock day', () => {
      const lesson = makeDripLesson({ drip_type: 'days_after_enrollment', drip_value: 3 });
      const now = new Date('2026-01-04T00:00:01Z'); // exactly 3 days + 1 second
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(true);
    });

    it('handles string drip_value', () => {
      const lesson = makeDripLesson({ drip_type: 'days_after_enrollment', drip_value: '5' });
      const now = new Date('2026-01-08T00:00:00Z'); // 7 days after
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(true);
    });

    it('unlocks immediately for 0 days', () => {
      const lesson = makeDripLesson({ drip_type: 'days_after_enrollment', drip_value: 0 });
      const now = new Date('2026-01-01T00:00:01Z');
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(true);
    });
  });

  describe('fixed_date', () => {
    it('unlocks after fixed date', () => {
      const lesson = makeDripLesson({
        drip_type: 'fixed_date',
        drip_value: '2026-01-15T00:00:00Z',
      });
      const now = new Date('2026-01-16T00:00:00Z');
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(true);
    });

    it('locks before fixed date', () => {
      const lesson = makeDripLesson({
        drip_type: 'fixed_date',
        drip_value: '2026-02-01T00:00:00Z',
      });
      const now = new Date('2026-01-20T00:00:00Z');
      expect(isLessonUnlocked(lesson, enrolledAt, now)).toBe(false);
    });

    it('handles invalid date gracefully (defaults to unlocked)', () => {
      const lesson = makeDripLesson({
        drip_type: 'fixed_date',
        drip_value: 'not-a-date',
      });
      expect(isLessonUnlocked(lesson, enrolledAt)).toBe(true);
    });
  });
});

describe('getLessonUnlockDate', () => {
  const enrolledAt = new Date('2026-01-01T00:00:00Z');

  it('returns null for lessons with no drip', () => {
    const lesson = makeDripLesson({ drip_type: null });
    expect(getLessonUnlockDate(lesson, enrolledAt)).toBeNull();
  });

  it('calculates days_after_enrollment correctly', () => {
    const lesson = makeDripLesson({ drip_type: 'days_after_enrollment', drip_value: 7 });
    const unlockDate = getLessonUnlockDate(lesson, enrolledAt);
    expect(unlockDate).toBeDefined();
    expect(unlockDate!.toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });

  it('returns the fixed date', () => {
    const lesson = makeDripLesson({
      drip_type: 'fixed_date',
      drip_value: '2026-03-01T12:00:00Z',
    });
    const unlockDate = getLessonUnlockDate(lesson, enrolledAt);
    expect(unlockDate!.toISOString()).toBe('2026-03-01T12:00:00.000Z');
  });
});

describe('getLessonsUnlockingToday', () => {
  const enrolledAt = new Date('2026-01-01T00:00:00Z');

  it('returns lessons that unlocked within the window', () => {
    const lessons: LessonWithDrip[] = [
      makeDripLesson({ id: 'l1', drip_type: 'days_after_enrollment', drip_value: 7 }),
      makeDripLesson({ id: 'l2', drip_type: 'days_after_enrollment', drip_value: 14 }),
      makeDripLesson({ id: 'l3', drip_type: null }),
    ];

    // 7 days + 1 hour after enrollment — lesson 1 just unlocked
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-08T01:00:00Z'));

    const unlocking = getLessonsUnlockingToday(lessons, enrolledAt, 24);

    expect(unlocking).toHaveLength(1);
    expect(unlocking[0].id).toBe('l1');

    jest.useRealTimers();
  });

  it('returns empty array when no lessons unlock today', () => {
    const lessons: LessonWithDrip[] = [
      makeDripLesson({ id: 'l1', drip_type: 'days_after_enrollment', drip_value: 30 }),
    ];

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-05T00:00:00Z'));

    const unlocking = getLessonsUnlockingToday(lessons, enrolledAt, 24);
    expect(unlocking).toHaveLength(0);

    jest.useRealTimers();
  });
});
