import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const BatchItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(5000),
  output_filename: z.string().optional(),
});

const CreateBatchSchema = z.object({
  name: z.string().min(1).max(200),
  voice_id: z.string().min(1),
  items: z.array(BatchItemSchema).min(1).max(500),
  output_format: z.enum(['mp3', 'aac', 'wav', 'ogg']).default('mp3'),
  output_quality: z.enum(['standard', 'high', 'ultra']).default('high'),
});

// POST /api/tts/batch - Create batch audio generation job (TTS-010)
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Batch generation requires Pro or Studio TTS license
  const { data: license } = await supabase
    .from('licenses')
    .select('id, license_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('license_type', ['pro', 'studio'])
    .single();

  if (!license) {
    return NextResponse.json({
      error: 'TTS Studio Pro or Studio license required for batch generation',
      code: 'UPGRADE_REQUIRED',
    }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid batch request', details: parsed.error.issues }, { status: 400 });
  }

  // Check item limits by tier
  const itemLimits: Record<string, number> = { pro: 100, studio: 500 };
  const maxItems = itemLimits[license.license_type] ?? 100;

  if (parsed.data.items.length > maxItems) {
    return NextResponse.json({
      error: `Batch size limit is ${maxItems} items for your tier. Got ${parsed.data.items.length}.`,
      code: 'BATCH_LIMIT_EXCEEDED',
    }, { status: 400 });
  }

  const { data: job, error: insertError } = await supabase
    .from('tts_batch_jobs')
    .insert({
      user_id: user.id,
      license_id: license.id,
      name: parsed.data.name,
      voice_id: parsed.data.voice_id,
      items: parsed.data.items,
      output_format: parsed.data.output_format,
      output_quality: parsed.data.output_quality,
      total_items: parsed.data.items.length,
      status: 'queued',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create batch job' }, { status: 500 });
  }

  return NextResponse.json({
    job,
    message: `Batch job queued with ${parsed.data.items.length} items. Download link will be available when complete.`,
  }, { status: 201 });
}

// GET /api/tts/batch - List batch jobs
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data: job } = await supabase
      .from('tts_batch_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  }

  const { data: jobs } = await supabase
    .from('tts_batch_jobs')
    .select('id, name, status, total_items, completed_items, created_at, completed_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ jobs });
}
