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

const UpdateLicenseSchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked', 'expired']).optional(),
  max_devices: z.number().int().min(0).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  license_type: z.enum(['standard', 'pro', 'enterprise', 'trial']).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: license, error } = await supabaseAdmin
    .from('licenses')
    .select(`
      *,
      packages:package_id (id, name, slug, icon_url, type),
      users:user_id (id, email, full_name)
    `)
    .eq('id', params.id)
    .single();

  if (error || !license) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 });
  }

  // Get device activations for this license
  const { data: activations } = await supabaseAdmin
    .from('device_activations')
    .select('*')
    .eq('license_id', params.id)
    .order('created_at', { ascending: false });

  // Mask license key
  const maskedLicense = {
    ...license,
    license_key: maskLicenseKey(license.license_key),
    license_key_hash: undefined,
  };

  return NextResponse.json({
    license: maskedLicense,
    activations: activations ?? [],
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = UpdateLicenseSchema.parse(body);

    // Check license exists
    const { data: existing } = await supabaseAdmin
      .from('licenses')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validated };

    // If revoking, set revoked_at
    if (validated.status === 'revoked' && existing.status !== 'revoked') {
      updateData.revoked_at = new Date().toISOString();
    }

    // If suspending, set suspended_at
    if (validated.status === 'suspended' && existing.status !== 'suspended') {
      updateData.suspended_at = new Date().toISOString();
    }

    // If reactivating from suspended/revoked
    if (validated.status === 'active' && (existing.status === 'suspended' || existing.status === 'revoked')) {
      updateData.revoked_at = null;
      updateData.suspended_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('licenses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating license:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      license: {
        ...data,
        license_key: maskLicenseKey(data.license_key),
        license_key_hash: undefined,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function maskLicenseKey(key: string | null): string {
  if (!key) return '****-****-****-****';
  const parts = key.split('-');
  if (parts.length === 4) {
    return `****-****-****-${parts[3]}`;
  }
  return '****-****-****-****';
}
