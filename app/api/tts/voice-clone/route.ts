import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const CreateCloneSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sample_audio_urls: z.array(z.string().url()).min(3).max(30),
  voice_characteristics: z.object({
    gender: z.enum(['male', 'female', 'neutral']).optional(),
    accent: z.string().optional(),
    age_range: z.enum(['young', 'middle', 'mature']).optional(),
  }).optional(),
  is_public: z.boolean().default(false),
});

// GET /api/tts/voice-clone - List user voice clones (TTS-009)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includePublic = searchParams.get('include_public') === 'true';

  let query = supabase
    .from('tts_voice_clones')
    .select('*')
    .order('created_at', { ascending: false });

  if (includePublic) {
    query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
  } else {
    query = query.eq('user_id', user.id);
  }

  const { data: clones, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch voice clones' }, { status: 500 });
  }

  return NextResponse.json({ voice_clones: clones });
}

// POST /api/tts/voice-clone - Create a new voice clone (TTS-009)
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Voice cloning requires Pro or Studio TTS license
  const { data: license } = await supabase
    .from('licenses')
    .select('id, license_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('license_type', ['pro', 'studio'])
    .single();

  if (!license) {
    return NextResponse.json({
      error: 'TTS Studio Pro or Studio license required for voice cloning',
      code: 'UPGRADE_REQUIRED',
    }, { status: 403 });
  }

  // Check clone limit per tier
  const cloneLimits: Record<string, number> = { pro: 3, studio: -1 };
  const limit = cloneLimits[license.license_type] ?? 3;

  if (limit !== -1) {
    const { count } = await supabase
      .from('tts_voice_clones')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'archived');

    if ((count ?? 0) >= limit) {
      return NextResponse.json({
        error: `Voice clone limit of ${limit} reached. Upgrade to Studio for unlimited clones.`,
        code: 'CLONE_LIMIT_REACHED',
      }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateCloneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // Create the voice clone record (training happens asynchronously)
  const { data: clone, error: insertError } = await supabase
    .from('tts_voice_clones')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      sample_audio_urls: parsed.data.sample_audio_urls,
      voice_characteristics: parsed.data.voice_characteristics ?? {},
      is_public: parsed.data.is_public,
      status: 'training',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create voice clone' }, { status: 500 });
  }

  return NextResponse.json({
    voice_clone: clone,
    message: 'Voice clone training started. This takes 2-5 minutes. Check status via GET /api/tts/voice-clone.',
  }, { status: 201 });
}
