import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const ValidateSSMLSchema = z.object({
  ssml: z.string().min(1).max(10000),
});

// GET /api/tts/ssml - Get SSML presets (TTS-011)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('tts_ssml_presets')
    .select('*')
    .order('usage_count', { ascending: false });

  if (user) {
    query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
  } else {
    query = query.eq('is_public', true);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: presets, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch SSML presets' }, { status: 500 });
  }

  return NextResponse.json({ presets });
}

// POST /api/tts/ssml/validate - Validate SSML markup (TTS-011)
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

  const parsed = ValidateSSMLSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // Basic SSML validation
  const ssml = parsed.data.ssml;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for <speak> root element
  if (!ssml.trim().startsWith('<speak>')) {
    errors.push('SSML must start with <speak> root element');
  }
  if (!ssml.trim().endsWith('</speak>')) {
    errors.push('SSML must end with </speak> closing tag');
  }

  // Check for common supported elements
  const supportedElements = ['speak', 'break', 'emphasis', 'prosody', 'say-as', 'phoneme', 'sub', 'lang', 'amazon:effect'];
  const usedElements = [...ssml.matchAll(/<(\w+[:\w]*)/g)].map(m => m[1]);
  const unsupportedElements = usedElements.filter(el => !supportedElements.includes(el));
  if (unsupportedElements.length > 0) {
    warnings.push(`Unsupported elements (may not work on all voices): ${unsupportedElements.join(', ')}`);
  }

  // Check break time values
  const breakTimes = [...ssml.matchAll(/break time="([^"]+)"/g)];
  for (const match of breakTimes) {
    const time = match[1];
    if (!time.endsWith('s') && !time.endsWith('ms')) {
      errors.push(`Invalid break time "${time}" — must end with "s" (seconds) or "ms" (milliseconds)`);
    }
  }

  // Estimate character count (affects cost)
  const textContent = ssml.replace(/<[^>]+>/g, '').trim();

  return NextResponse.json({
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      character_count: textContent.length,
      estimated_duration_seconds: Math.ceil(textContent.length / 15), // rough estimate: 15 chars/sec
      ssml_tag_count: usedElements.length,
    },
  });
}
