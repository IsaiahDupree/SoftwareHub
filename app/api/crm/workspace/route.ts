import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const CreateWorkspaceSchema = z.object({
  workspace_name: z.string().min(1).max(100),
});

// GET /api/crm/workspace - Get user's CRM workspace and stats (CRM-001, CRM-003)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user has EverReach CRM license
  const { data: license } = await supabase
    .from('licenses')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Get user's CRM workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('crm_tenants')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Get contact stats
  const { data: contacts } = await supabase
    .from('crm_contacts')
    .select('warmth_score, next_followup_at')
    .eq('tenant_id', workspace.id);

  const stats = {
    total: contacts?.length ?? 0,
    hot: contacts?.filter(c => c.warmth_score >= 80).length ?? 0,
    warm: contacts?.filter(c => c.warmth_score >= 50 && c.warmth_score < 80).length ?? 0,
    cold: contacts?.filter(c => c.warmth_score < 40).length ?? 0,
    followups_due: contacts?.filter(c =>
      c.next_followup_at && new Date(c.next_followup_at) <= new Date()
    ).length ?? 0,
  };

  return NextResponse.json({ workspace, stats, has_license: !!license });
}

// POST /api/crm/workspace - Create CRM workspace (CRM-001)
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user doesn't already have a workspace
  const { data: existing } = await supabase
    .from('crm_tenants')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Workspace already exists' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // Generate workspace slug from name + user id prefix
  const baseSlug = parsed.data.workspace_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const uniqueSuffix = user.id.split('-')[0]; // first 8 chars of user UUID
  const workspaceSlug = `${baseSlug}-${uniqueSuffix}`;

  const { data: workspace, error: createError } = await supabase
    .from('crm_tenants')
    .insert({
      user_id: user.id,
      workspace_name: parsed.data.workspace_name,
      workspace_slug: workspaceSlug,
    })
    .select()
    .single();

  if (createError) {
    console.error('CRM workspace creation error:', createError);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }

  return NextResponse.json({ workspace }, { status: 201 });
}
