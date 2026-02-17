import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const CreateTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  prompt_template: z.string().min(10).max(2000),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'select']),
    options: z.array(z.string()).optional(),
    default: z.string().optional(),
  })).default([]),
  category: z.enum(['product_demo', 'lifestyle', 'testimonial', 'educational', 'entertainment']).optional(),
  is_public: z.boolean().default(false),
});

// GET /api/sora/templates - List prompt templates (SORA-004)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const mine = searchParams.get('mine') === 'true';

  let query = supabase
    .from('sora_prompt_templates')
    .select('*')
    .order('usage_count', { ascending: false });

  if (mine && user) {
    query = query.eq('user_id', user.id);
  } else {
    // Public templates + user's own
    if (user) {
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
    } else {
      query = query.eq('is_public', true);
    }
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: templates, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }

  return NextResponse.json({ templates });
}

// POST /api/sora/templates - Create a custom template
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

  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid template', details: parsed.error.issues }, { status: 400 });
  }

  const { data: template, error: insertError } = await supabase
    .from('sora_prompt_templates')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }

  return NextResponse.json({ template }, { status: 201 });
}
