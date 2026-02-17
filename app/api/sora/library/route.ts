import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const UpdateLibrarySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
});

// GET /api/sora/library - Get user video library (SORA-006)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const tag = searchParams.get('tag');
  const favorites = searchParams.get('favorites') === 'true';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('sora_video_library')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (favorites) {
    query = query.eq('is_favorite', true);
  }

  const { data: videos, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }

  return NextResponse.json({
    videos,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

// POST /api/sora/library - Save a generated video to library
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const SaveSchema = z.object({
    generation_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    tags: z.array(z.string()).default([]),
  });

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // Verify generation belongs to user and is completed
  const { data: generation } = await supabase
    .from('sora_generations')
    .select('id, output_url, thumbnail_url, duration_seconds, status')
    .eq('id', parsed.data.generation_id)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single();

  if (!generation || !generation.output_url) {
    return NextResponse.json({ error: 'Generation not found or not completed' }, { status: 404 });
  }

  const { data: video, error: insertError } = await supabase
    .from('sora_video_library')
    .insert({
      user_id: user.id,
      generation_id: generation.id,
      title: parsed.data.title,
      tags: parsed.data.tags,
      video_url: generation.output_url,
      thumbnail_url: generation.thumbnail_url,
      duration_seconds: generation.duration_seconds,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save to library' }, { status: 500 });
  }

  return NextResponse.json({ video }, { status: 201 });
}
