import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');

  // Get the package first
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  let query = supabase
    .from('package_releases')
    .select('*')
    .eq('package_id', pkg.id)
    .eq('is_published', true)
    .eq('is_yanked', false)
    .order('version_major', { ascending: false })
    .order('version_minor', { ascending: false })
    .order('version_patch', { ascending: false });

  if (channel && ['stable', 'beta', 'alpha', 'dev'].includes(channel)) {
    query = query.eq('channel', channel);
  }

  const { data: releases, error } = await query;

  if (error) {
    console.error('Error fetching releases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ releases: releases ?? [] });
}
