import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  // Filters
  const status = searchParams.get('status');
  const packageId = searchParams.get('package_id');
  const userId = searchParams.get('user_id');
  const search = searchParams.get('search');

  let query = supabaseAdmin
    .from('licenses')
    .select(`
      *,
      packages:package_id (id, name, slug, icon_url),
      users:user_id (id, email, full_name)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (packageId) {
    query = query.eq('package_id', packageId);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (search) {
    // Search by email (via user join) or by license key hash
    // For partial key search, we search the last segment stored in plain text isn't available
    // So we search by user email instead
    query = query.or(`license_key.ilike.%${search}%,users.email.ilike.%${search}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask license keys for display
  const licenses = (data ?? []).map((license: Record<string, unknown>) => ({
    ...license,
    license_key: maskLicenseKey(license.license_key as string | null),
    license_key_hash: undefined,
  }));

  return NextResponse.json({
    licenses,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}

function maskLicenseKey(key: string | null): string {
  if (!key) return '****-****-****-****';
  const parts = key.split('-');
  if (parts.length === 4) {
    return `****-****-****-${parts[3]}`;
  }
  return '****-****-****-****';
}
