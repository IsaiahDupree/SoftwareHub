import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

const SSOGenerateSchema = z.object({
  workspace_slug: z.string().min(1),
});

// POST /api/crm/sso - Generate SSO token for CRM workspace access (CRM-002)
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

  const parsed = SSOGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  const { workspace_slug } = parsed.data;

  // Verify user owns this CRM workspace
  const { data: tenant, error: tenantError } = await supabase
    .from('crm_tenants')
    .select('id, workspace_slug')
    .eq('user_id', user.id)
    .eq('workspace_slug', workspace_slug)
    .eq('is_active', true)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Revoke any existing tokens for this user+tenant
  await supabase
    .from('crm_sso_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id);

  // Generate a secure SSO token (64 hex chars = 256 bits)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minute TTL

  const { error: insertError } = await supabase
    .from('crm_sso_tokens')
    .insert({
      user_id: user.id,
      tenant_id: tenant.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    console.error('Failed to create SSO token:', insertError);
    return NextResponse.json({ error: 'Failed to generate SSO token' }, { status: 500 });
  }

  const crmUrl = process.env.EVERREACH_CRM_URL ?? 'https://crm.softwarehub.app';

  return NextResponse.json({
    sso_url: `${crmUrl}/auth/sso?token=${token}&workspace=${workspace_slug}`,
    token,
    expires_at: expiresAt.toISOString(),
  });
}

// GET /api/crm/sso/verify?token=... - Verify SSO token (called by CRM app)
export async function GET(request: Request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const { data: ssoToken, error } = await supabase
    .from('crm_sso_tokens')
    .select('*, crm_tenants(workspace_slug, workspace_name)')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !ssoToken) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Mark token as used
  await supabase
    .from('crm_sso_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', ssoToken.id);

  // Get user email
  const { data: { user } } = await supabase.auth.admin.getUserById(ssoToken.user_id);

  return NextResponse.json({
    valid: true,
    user_id: ssoToken.user_id,
    email: user?.email,
    tenant_id: ssoToken.tenant_id,
    workspace: ssoToken.crm_tenants,
  });
}
