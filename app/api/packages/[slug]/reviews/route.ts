// app/api/packages/[slug]/reviews/route.ts
// GET  - List reviews for a package (public)
// POST - Submit a review (requires purchase entitlement)
// PLT-004

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = (page - 1) * limit;
  const sort = searchParams.get('sort') || 'helpful'; // helpful | newest | rating_high | rating_low

  // Look up package
  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  let query = supabaseAdmin
    .from('package_reviews')
    .select(`
      id,
      rating,
      title,
      body,
      verified,
      helpful_count,
      created_at,
      users:user_id (full_name, avatar_url)
    `, { count: 'exact' })
    .eq('package_id', pkg.id)
    .eq('status', 'published');

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'rating_high') {
    query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
  } else if (sort === 'rating_low') {
    query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
  } else {
    // Default: most helpful
    query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: reviews, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch rating summary
  const { data: summary } = await supabaseAdmin
    .from('package_rating_summary')
    .select('*')
    .eq('package_id', pkg.id)
    .single();

  return NextResponse.json({
    reviews: reviews ?? [],
    summary: summary ?? { review_count: 0, average_rating: null },
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up package
  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('id, name')
    .eq('slug', params.slug)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  // Check user has purchased the package
  const { data: entitlement } = await supabaseAdmin
    .from('package_entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('package_id', pkg.id)
    .single();

  if (!entitlement) {
    return NextResponse.json(
      { error: 'You must purchase this product before leaving a review' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validated = CreateReviewSchema.parse(body);

    const { data: review, error } = await supabaseAdmin
      .from('package_reviews')
      .upsert({
        package_id: pkg.id,
        user_id: user.id,
        rating: validated.rating,
        title: validated.title ?? null,
        body: validated.body ?? null,
        verified: true, // verified purchase confirmed above
        status: 'published',
      }, { onConflict: 'package_id,user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Error creating review:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
