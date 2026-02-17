import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const StitchJobSchema = z.object({
  title: z.string().min(1).max(200),
  segments: z.array(z.object({
    video_id: z.string().uuid(),
    start_seconds: z.number().min(0).optional(),
    end_seconds: z.number().min(0).optional(),
    transition: z.enum(['cut', 'fade', 'slide', 'zoom']).default('cut'),
  })).min(2).max(20),
  background_music_url: z.string().url().optional(),
});

// POST /api/sora/stitch - Create a multi-part video stitching job (SORA-009)
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user has active Sora Pro/Studio license for stitching
  const { data: license } = await supabase
    .from('licenses')
    .select('id, license_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('license_type', ['pro', 'studio'])
    .single();

  if (!license) {
    return NextResponse.json({
      error: 'Sora Video Pro or Studio license required for video stitching',
      code: 'UPGRADE_REQUIRED',
    }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = StitchJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid stitch job', details: parsed.error.issues }, { status: 400 });
  }

  // Verify all video IDs belong to this user
  const videoIds = parsed.data.segments.map(s => s.video_id);
  const { data: ownedVideos } = await supabase
    .from('sora_video_library')
    .select('id')
    .eq('user_id', user.id)
    .in('id', videoIds);

  if ((ownedVideos?.length ?? 0) !== videoIds.length) {
    return NextResponse.json({ error: 'One or more video IDs not found' }, { status: 400 });
  }

  const { data: job, error: insertError } = await supabase
    .from('sora_stitch_jobs')
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      input_segments: parsed.data.segments,
      background_music_url: parsed.data.background_music_url,
      status: 'queued',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create stitch job' }, { status: 500 });
  }

  return NextResponse.json({ job }, { status: 201 });
}

// GET /api/sora/stitch - List stitching jobs
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: jobs } = await supabase
    .from('sora_stitch_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ jobs });
}
