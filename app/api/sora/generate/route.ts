import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const GenerateSchema = z.object({
  prompt: z.string().min(10).max(2000),
  duration_seconds: z.number().int().min(3).max(60).default(5),
  resolution: z.enum(['480p', '720p', '1080p']).default('1080p'),
  aspect_ratio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  style_preset: z.string().optional(),
  reference_image_url: z.string().url().optional(),
});

// POST /api/sora/generate - Queue a Sora video generation (SORA-005)
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user has active Sora Video license
  const { data: license } = await supabase
    .from('licenses')
    .select('id, license_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('package_id', supabase
      .from('packages')
      .select('id')
      .eq('slug', 'sora-video') as unknown as string[])
    .single();

  if (!license) {
    return NextResponse.json({ error: 'Active Sora Video license required', code: 'NO_LICENSE' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // Check daily generation limits by tier
  const tierLimits: Record<string, number> = {
    creator: 10,
    pro: 50,
    studio: -1, // unlimited
  };

  const dailyLimit = tierLimits[license.license_type] ?? 10;

  if (dailyLimit !== -1) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('sora_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString());

    if ((todayCount ?? 0) >= dailyLimit) {
      return NextResponse.json({
        error: `Daily generation limit of ${dailyLimit} reached. Upgrade to Pro for higher limits.`,
        code: 'DAILY_LIMIT_REACHED',
      }, { status: 429 });
    }
  }

  const { data: generation, error: insertError } = await supabase
    .from('sora_generations')
    .insert({
      user_id: user.id,
      license_id: license.id,
      ...parsed.data,
      status: 'queued',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Generation insert error:', insertError);
    return NextResponse.json({ error: 'Failed to queue generation' }, { status: 500 });
  }

  return NextResponse.json({ generation }, { status: 201 });
}

// GET /api/sora/generate?id=... - Check generation status (SORA-005)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    // List recent generations
    const { data: generations } = await supabase
      .from('sora_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ generations });
  }

  const { data: generation } = await supabase
    .from('sora_generations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!generation) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
  }

  return NextResponse.json({ generation });
}
