// app/api/packages/[slug]/reviews/[reviewId]/route.ts
// DELETE - Remove user's own review
// POST /vote - Vote helpful/not helpful
// PLT-004

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; reviewId: string } }
) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('package_reviews')
    .delete()
    .eq('id', params.reviewId)
    .eq('user_id', user.id); // Only own review

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

const VoteSchema = z.object({
  helpful: z.boolean(),
});

// POST /api/packages/[slug]/reviews/[reviewId]/vote
// Handled as a sub-resource — call via fetch('/api/packages/slug/reviews/id', { method: 'PATCH', body: { helpful: true } })
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; reviewId: string } }
) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = VoteSchema.parse(body);

    // Upsert vote
    const { error } = await supabaseAdmin
      .from('package_review_votes')
      .upsert({
        review_id: params.reviewId,
        user_id: user.id,
        helpful: validated.helpful,
      }, { onConflict: 'review_id,user_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return updated helpful count
    const { data: review } = await supabaseAdmin
      .from('package_reviews')
      .select('id, helpful_count')
      .eq('id', params.reviewId)
      .single();

    return NextResponse.json({ helpful_count: review?.helpful_count ?? 0 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
