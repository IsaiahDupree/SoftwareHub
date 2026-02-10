import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');
  const packageId = searchParams.get('package_id');

  // Build query for public activities + user's private ones
  let query = supabaseAdmin
    .from('activity_feed')
    .select(`
      *,
      packages:package_id (id, name, slug, icon_url)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  // Filter visibility
  if (user) {
    query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
  } else {
    query = query.eq('visibility', 'public');
  }

  // Filter by type
  if (type) {
    query = query.eq('type', type);
  }

  // Filter by package
  if (packageId) {
    query = query.eq('package_id', packageId);
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Filter out expired items
  query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = data ?? [];
  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? results[results.length - 1].created_at : null;

  return NextResponse.json({
    items: results,
    next_cursor: nextCursor,
    has_more: hasMore,
  });
}
