import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

async function checkAdmin(supabase: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

const CreateActivitySchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().nullable().optional(),
  package_id: z.string().uuid().nullable().optional(),
  is_pinned: z.boolean().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  action_url: z.string().nullable().optional(),
  action_label: z.string().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = CreateActivitySchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('activity_feed')
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activity: data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
