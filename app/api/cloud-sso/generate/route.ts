import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSSOToken } from '@/lib/cloud-sso/token';
import { z } from 'zod';

export const runtime = 'nodejs';

const GenerateSchema = z.object({
  package_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { package_id } = GenerateSchema.parse(body);

    // Get package
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('id, name, type, cloud_app_url')
      .eq('id', package_id)
      .eq('type', 'CLOUD_APP')
      .single();

    if (!pkg) {
      return NextResponse.json({ error: 'Cloud app not found' }, { status: 404 });
    }

    if (!pkg.cloud_app_url) {
      return NextResponse.json({ error: 'Cloud app URL not configured' }, { status: 400 });
    }

    // Check entitlement
    const { data: entitlement } = await supabaseAdmin
      .from('package_entitlements')
      .select('id')
      .eq('user_id', user.id)
      .eq('package_id', package_id)
      .eq('has_access', true)
      .maybeSingle();

    if (!entitlement) {
      return NextResponse.json({ error: 'No access to this package' }, { status: 403 });
    }

    // Get all user entitlements for this cloud app
    const { data: allEnts } = await supabaseAdmin
      .from('package_entitlements')
      .select('package_id')
      .eq('user_id', user.id)
      .eq('has_access', true);

    const token = await generateSSOToken({
      userId: user.id,
      email: user.email || '',
      packageId: package_id,
      entitlements: (allEnts ?? []).map((e) => e.package_id),
    });

    // Build redirect URL
    const redirectUrl = new URL(pkg.cloud_app_url);
    redirectUrl.searchParams.set('sso_token', token);

    return NextResponse.json({
      token,
      redirect_url: redirectUrl.toString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('SSO generate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
