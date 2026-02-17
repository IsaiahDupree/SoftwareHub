import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateUniqueLicenseKey } from '@/lib/licenses/generate';
import { hashLicenseKey } from '@/lib/licenses/hash';
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

const GenerateLicenseSchema = z.object({
  package_id: z.string().uuid(),
  user_id: z.string().uuid(),
  license_type: z.enum(['standard', 'pro', 'enterprise', 'trial']).default('standard'),
  max_devices: z.number().int().min(1).max(100).default(3),
  expires_at: z.string().datetime().nullable().optional(),
  source: z.enum(['manual', 'gift', 'promo']).default('manual'),
});

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const adminUser = await checkAdmin(supabase);

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = GenerateLicenseSchema.parse(body);

    // Verify the package exists
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('id, name, slug, status')
      .eq('id', validated.package_id)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Verify the user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', validated.user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a unique license key
    const licenseKey = await generateUniqueLicenseKey();
    const licenseKeyHash = hashLicenseKey(licenseKey);

    // Determine expiry
    const expiresAt = validated.expires_at !== undefined
      ? validated.expires_at
      : validated.license_type === 'trial'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Create the license
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .insert({
        package_id: validated.package_id,
        user_id: validated.user_id,
        license_key: licenseKey,
        license_key_hash: licenseKeyHash,
        license_type: validated.license_type,
        status: 'active',
        max_devices: validated.max_devices,
        active_devices: 0,
        expires_at: expiresAt,
        source: validated.source,
      })
      .select()
      .single();

    if (licenseError) {
      console.error('Error creating license:', licenseError);
      return NextResponse.json({ error: licenseError.message }, { status: 500 });
    }

    // Create package entitlement
    await supabaseAdmin
      .from('package_entitlements')
      .upsert({
        user_id: validated.user_id,
        package_id: validated.package_id,
        source: validated.source,
        granted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,package_id' });

    return NextResponse.json({
      license: {
        ...license,
        // Return the plain key only at creation time so admin can share it
        license_key: licenseKey,
        license_key_hash: undefined,
      },
      package: { id: pkg.id, name: pkg.name, slug: pkg.slug },
      user: { id: targetUser.id, email: targetUser.email, full_name: targetUser.full_name },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error generating license:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
