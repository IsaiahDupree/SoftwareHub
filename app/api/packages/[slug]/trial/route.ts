import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

interface RouteParams {
  params: { slug: string };
}

/**
 * POST /api/packages/[slug]/trial - Start a free trial for a package
 *
 * Creates a time-limited trial entitlement and license.
 * Enforces one trial per user per package.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the package
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('id, name, slug, trial_enabled, trial_days')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (!pkg.trial_enabled) {
      return NextResponse.json({ error: 'Trial is not available for this package' }, { status: 400 });
    }

    // Check if user already has an entitlement (purchased or trial)
    const { data: existingEntitlement } = await supabaseAdmin
      .from('package_entitlements')
      .select('id, source, has_access')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .maybeSingle();

    if (existingEntitlement?.has_access) {
      return NextResponse.json(
        { error: 'You already have access to this package' },
        { status: 400 }
      );
    }

    // Check if user already had a trial for this package
    const { data: existingTrial } = await supabaseAdmin
      .from('package_trials')
      .select('id, expires_at, converted_at')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .maybeSingle();

    if (existingTrial) {
      return NextResponse.json(
        { error: 'You have already used a trial for this package' },
        { status: 400 }
      );
    }

    // Create trial
    const trialDays = pkg.trial_days || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + trialDays);

    // Generate trial license key
    const { generateUniqueLicenseKey } = await import('@/lib/licenses/generate');
    const { hashLicenseKey } = await import('@/lib/licenses/hash');

    const licenseKey = await generateUniqueLicenseKey();
    const keyHash = hashLicenseKey(licenseKey);

    // Create license
    const { data: license, error: licError } = await supabaseAdmin
      .from('licenses')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        license_key: licenseKey,
        license_key_hash: keyHash,
        license_type: 'trial',
        max_devices: 1,
        status: 'active',
        source: 'trial',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (licError) {
      console.error('Error creating trial license:', licError);
      return NextResponse.json({ error: 'Failed to create trial' }, { status: 500 });
    }

    // Create entitlement
    await supabaseAdmin.from('package_entitlements').upsert(
      {
        user_id: user.id,
        package_id: pkg.id,
        has_access: true,
        access_level: 'trial',
        source: 'promo',
        source_id: `trial_${license.id}`,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id,package_id' }
    );

    // Record trial
    await supabaseAdmin.from('package_trials').insert({
      user_id: user.id,
      package_id: pkg.id,
      license_id: license.id,
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      trial: {
        package_name: pkg.name,
        license_key: licenseKey,
        expires_at: expiresAt.toISOString(),
        trial_days: trialDays,
      },
    });
  } catch (error) {
    console.error('Trial creation error:', error);
    return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 });
  }
}

/**
 * GET /api/packages/[slug]/trial - Check trial status for current user
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the package
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('id, trial_enabled, trial_days')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single();

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check existing trial
    const { data: trial } = await supabaseAdmin
      .from('package_trials')
      .select('id, started_at, expires_at, converted_at')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .maybeSingle();

    // Check entitlement
    const { data: entitlement } = await supabaseAdmin
      .from('package_entitlements')
      .select('has_access, access_level, source')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .maybeSingle();

    return NextResponse.json({
      trial_available: pkg.trial_enabled && !trial && !entitlement?.has_access,
      trial_days: pkg.trial_days || 7,
      existing_trial: trial
        ? {
            started_at: trial.started_at,
            expires_at: trial.expires_at,
            is_expired: new Date(trial.expires_at) < new Date(),
            converted: !!trial.converted_at,
          }
        : null,
      has_access: entitlement?.has_access || false,
      access_level: entitlement?.access_level || null,
    });
  } catch (error) {
    console.error('Trial status check error:', error);
    return NextResponse.json({ error: 'Failed to check trial status' }, { status: 500 });
  }
}
