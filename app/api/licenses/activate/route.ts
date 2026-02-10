import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashLicenseKey, hashDeviceId } from '@/lib/licenses/hash';
import { generateActivationToken } from '@/lib/licenses/token';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';

const ActivateSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  device_id: z.string().min(1, 'Device ID is required'),
  device_name: z.string().optional(),
  device_type: z.string().optional(),
  os_name: z.string().optional(),
  os_version: z.string().optional(),
  app_version: z.string().optional(),
  hardware_model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 per hour per license key
  const rateLimitResult = checkRateLimit(req, {
    maxRequests: 10,
    windowSeconds: 3600,
  });
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    const validated = ActivateSchema.parse(body);

    const keyHash = hashLicenseKey(validated.license_key);
    const deviceHash = hashDeviceId(validated.device_id);

    // Look up license by hash
    const { data: license, error: licError } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('license_key_hash', keyHash)
      .single();

    if (licError || !license) {
      return NextResponse.json(
        { error: 'Invalid license key' },
        { status: 404 }
      );
    }

    // Check license status
    if (license.status !== 'active') {
      return NextResponse.json(
        { error: `License is ${license.status}`, code: 'LICENSE_INACTIVE' },
        { status: 403 }
      );
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'License has expired', code: 'LICENSE_EXPIRED' },
        { status: 403 }
      );
    }

    // Check if device is already activated for this license
    const { data: existingActivation } = await supabaseAdmin
      .from('device_activations')
      .select('*')
      .eq('license_id', license.id)
      .eq('device_id_hash', deviceHash)
      .single();

    if (existingActivation && existingActivation.is_active) {
      // Refresh the token
      const token = await generateActivationToken({
        licenseId: license.id,
        packageId: license.package_id,
        deviceIdHash: deviceHash,
        userId: license.user_id,
      });

      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 30);

      await supabaseAdmin
        .from('device_activations')
        .update({
          activation_token: token,
          token_expires_at: tokenExpiry.toISOString(),
          last_seen_at: new Date().toISOString(),
          app_version: validated.app_version || existingActivation.app_version,
        })
        .eq('id', existingActivation.id);

      return NextResponse.json({
        activation_token: token,
        expires_at: tokenExpiry.toISOString(),
        device_id: validated.device_id,
        license_id: license.id,
        package_id: license.package_id,
      });
    }

    // Check device limit
    if (
      license.max_devices > 0 &&
      license.active_devices >= license.max_devices
    ) {
      return NextResponse.json(
        {
          error: 'Device limit exceeded',
          code: 'DEVICE_LIMIT',
          max_devices: license.max_devices,
          active_devices: license.active_devices,
        },
        { status: 403 }
      );
    }

    // Generate activation token
    const token = await generateActivationToken({
      licenseId: license.id,
      packageId: license.package_id,
      deviceIdHash: deviceHash,
      userId: license.user_id,
    });

    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30);

    // Create device activation
    const { error: activationError } = await supabaseAdmin
      .from('device_activations')
      .insert({
        license_id: license.id,
        device_id: validated.device_id,
        device_id_hash: deviceHash,
        device_name: validated.device_name,
        device_type: validated.device_type,
        os_name: validated.os_name,
        os_version: validated.os_version,
        app_version: validated.app_version,
        hardware_model: validated.hardware_model,
        activation_token: token,
        token_expires_at: tokenExpiry.toISOString(),
        last_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || null,
      });

    if (activationError) {
      console.error('Error creating activation:', activationError);
      return NextResponse.json(
        { error: 'Failed to activate device' },
        { status: 500 }
      );
    }

    // Increment active devices count
    await supabaseAdmin
      .from('licenses')
      .update({
        active_devices: license.active_devices + 1,
        activated_at: license.activated_at || new Date().toISOString(),
      })
      .eq('id', license.id);

    return NextResponse.json({
      activation_token: token,
      expires_at: tokenExpiry.toISOString(),
      device_id: validated.device_id,
      license_id: license.id,
      package_id: license.package_id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Activation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
