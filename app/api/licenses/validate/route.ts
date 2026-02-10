import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateActivationToken } from '@/lib/licenses/token';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';

const GRACE_PERIOD_DAYS = 7;

const ValidateSchema = z.object({
  activation_token: z.string().min(1, 'Activation token is required'),
  device_id: z.string().min(1, 'Device ID is required'),
});

export async function POST(req: NextRequest) {
  // Rate limit: 100 per hour per device
  const rateLimitResult = checkRateLimit(req, {
    maxRequests: 100,
    windowSeconds: 3600,
  });
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    const validated = ValidateSchema.parse(body);

    // Verify JWT token
    let payload;
    try {
      payload = await validateActivationToken(validated.activation_token);
    } catch {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token', code: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }

    // Verify device matches
    const { hashDeviceId } = await import('@/lib/licenses/hash');
    const deviceHash = hashDeviceId(validated.device_id);

    if (payload.did !== deviceHash) {
      return NextResponse.json(
        { valid: false, error: 'Device mismatch', code: 'DEVICE_MISMATCH' },
        { status: 403 }
      );
    }

    // Check license still active
    const { data: license, error: licError } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('id', payload.lid)
      .single();

    if (licError || !license) {
      return NextResponse.json(
        { valid: false, error: 'License not found', code: 'LICENSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (license.status === 'revoked') {
      return NextResponse.json(
        { valid: false, error: 'License has been revoked', code: 'LICENSE_REVOKED' },
        { status: 403 }
      );
    }

    if (license.status === 'suspended') {
      return NextResponse.json(
        { valid: false, error: 'License is suspended', code: 'LICENSE_SUSPENDED' },
        { status: 403 }
      );
    }

    // Check license expiration with grace period
    if (license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      const now = new Date();
      const gracePeriodEnd = new Date(expiresAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

      if (now > gracePeriodEnd) {
        return NextResponse.json(
          {
            valid: false,
            error: 'License has expired',
            code: 'LICENSE_EXPIRED',
            expired_at: license.expires_at,
          },
          { status: 403 }
        );
      }

      if (now > expiresAt) {
        // In grace period
        return NextResponse.json({
          valid: true,
          grace_period: true,
          expires_at: license.expires_at,
          grace_period_ends: gracePeriodEnd.toISOString(),
          license_id: license.id,
          package_id: license.package_id,
        });
      }
    }

    // Update last_validated_at
    await supabaseAdmin
      .from('device_activations')
      .update({
        last_validated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        last_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || null,
      })
      .eq('license_id', payload.lid)
      .eq('device_id_hash', deviceHash);

    return NextResponse.json({
      valid: true,
      license_id: license.id,
      package_id: license.package_id,
      license_type: license.license_type,
      expires_at: license.expires_at,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Validation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
