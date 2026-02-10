import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const { slug } = params;

  const { data: pkg, error } = await supabase
    .from('packages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  // Check if user is logged in to show entitlement info
  const { data: { user } } = await supabase.auth.getUser();
  let entitlement = null;

  if (user) {
    const { data: ent } = await supabase
      .from('package_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .eq('has_access', true)
      .single();

    entitlement = ent;
  }

  return NextResponse.json({
    package: pkg,
    entitlement,
  });
}
