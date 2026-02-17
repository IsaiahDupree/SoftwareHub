import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { ArrowLeft, Users, CheckCircle, TrendingDown, BookOpen } from 'lucide-react';

interface Props {
  params: { id: string };
}

interface LessonStats {
  lesson_id: string;
  lesson_title: string;
  module_title: string;
  sort_order: number;
  completions: number;
  completion_rate: number;
  drop_off_pct: number | null;
}

export default async function CourseAnalyticsPage({ params }: Props) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/app');
  }

  // Get the course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('id', params.id)
    .single();

  if (!course) notFound();

  // Get total enrollments
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', params.id);

  const totalEnrollments = enrollmentCount ?? 0;

  // Get all lessons for this course (ordered by sort_order)
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      sort_order,
      modules!inner (
        id,
        title,
        course_id
      )
    `)
    .eq('modules.course_id', params.id)
    .order('sort_order', { ascending: true });

  const lessons = lessonsData ?? [];

  // Get lesson completion counts
  const lessonIds = lessons.map((l) => l.id);

  let completionCounts: Record<string, number> = {};
  if (lessonIds.length > 0) {
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .in('lesson_id', lessonIds)
      .not('completed_at', 'is', null);

    if (progressData) {
      for (const row of progressData) {
        completionCounts[row.lesson_id] = (completionCounts[row.lesson_id] ?? 0) + 1;
      }
    }
  }

  // Count users who completed ALL lessons (course completion)
  let completedUsersCount = 0;
  if (lessons.length > 0 && totalEnrollments > 0) {
    // Get users who have completed every lesson
    const { data: enrolledUsers } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('course_id', params.id);

    if (enrolledUsers && enrolledUsers.length > 0) {
      for (const { user_id } of enrolledUsers) {
        const { count: userCompletedCount } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .in('lesson_id', lessonIds)
          .eq('user_id', user_id)
          .not('completed_at', 'is', null);

        if ((userCompletedCount ?? 0) >= lessons.length) {
          completedUsersCount++;
        }
      }
    }
  }

  const completionRate =
    totalEnrollments > 0 ? Math.round((completedUsersCount / totalEnrollments) * 100) : 0;

  // Calculate average progress (avg lessons completed per enrolled user)
  let avgProgress = 0;
  if (totalEnrollments > 0 && lessons.length > 0) {
    const totalCompletions = Object.values(completionCounts).reduce((sum, c) => sum + c, 0);
    const avgLessonsCompleted = totalCompletions / totalEnrollments;
    avgProgress = Math.round((avgLessonsCompleted / lessons.length) * 100);
  }

  // Build lesson stats with drop-off analysis
  const lessonStats: LessonStats[] = lessons.map((lesson, index) => {
    const lessonCompletions = completionCounts[lesson.id] ?? 0;
    const lessonCompletionRate =
      totalEnrollments > 0 ? Math.round((lessonCompletions / totalEnrollments) * 100) : 0;

    let dropOffPct: number | null = null;
    if (index > 0) {
      const prevLesson = lessons[index - 1];
      const prevCompletions = completionCounts[prevLesson.id] ?? 0;
      if (prevCompletions > 0) {
        dropOffPct = Math.round(((prevCompletions - lessonCompletions) / prevCompletions) * 100);
      }
    }

    return {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      module_title: (lesson.modules as unknown as { title: string }).title,
      sort_order: lesson.sort_order,
      completions: lessonCompletions,
      completion_rate: lessonCompletionRate,
      drop_off_pct: dropOffPct,
    };
  });

  // Find biggest drop-off lesson
  const biggestDropOff = lessonStats
    .filter((l) => l.drop_off_pct !== null)
    .sort((a, b) => (b.drop_off_pct ?? 0) - (a.drop_off_pct ?? 0))[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Analytics: ${course.title}`}
        description="Enrollment, completion, and lesson-level engagement metrics"
        breadcrumbs={
          <Link
            href={`/admin/courses/${params.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>
        }
        actions={
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View Public Page &rarr;
          </Link>
        }
      />

      {/* Summary Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Enrollments"
          value={totalEnrollments}
          description="Students enrolled"
          icon={Users}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          description="Finished all lessons"
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Progress"
          value={`${avgProgress}%`}
          description="Average lesson completion"
          icon={TrendingDown}
        />
        <StatCard
          title="Total Lessons"
          value={lessons.length}
          description="Lessons in course"
          icon={BookOpen}
        />
      </StatCardGrid>

      {/* Drop-off callout */}
      {biggestDropOff && (
        <Card className="border-amber-500 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-800">Highest Drop-off Point</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700">
              <span className="font-semibold">{biggestDropOff.lesson_title}</span> has the biggest
              drop-off at{' '}
              <span className="font-semibold">{biggestDropOff.drop_off_pct}%</span> fewer
              completions than the previous lesson.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lesson Completion Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Completion Breakdown</CardTitle>
          <CardDescription>
            Completions per lesson and drop-off from the previous lesson
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No lessons found for this course.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Lesson</th>
                    <th className="text-left p-3 font-medium">Module</th>
                    <th className="text-right p-3 font-medium">Completions</th>
                    <th className="text-right p-3 font-medium">Rate</th>
                    <th className="text-right p-3 font-medium">Drop-off</th>
                  </tr>
                </thead>
                <tbody>
                  {lessonStats.map((lesson, index) => (
                    <tr key={lesson.lesson_id} className="border-t hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3">
                        <span className="font-medium">{lesson.lesson_title}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{lesson.module_title}</td>
                      <td className="p-3 text-right">
                        {lesson.completions.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            lesson.completion_rate >= 70
                              ? 'text-green-600 font-medium'
                              : lesson.completion_rate >= 40
                              ? 'text-amber-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          {lesson.completion_rate}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {lesson.drop_off_pct !== null ? (
                          <span
                            className={
                              lesson.drop_off_pct > 30
                                ? 'text-red-600 font-medium'
                                : lesson.drop_off_pct > 10
                                ? 'text-amber-600'
                                : 'text-muted-foreground'
                            }
                          >
                            {lesson.drop_off_pct > 0 ? `-${lesson.drop_off_pct}%` : `+${Math.abs(lesson.drop_off_pct)}%`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
