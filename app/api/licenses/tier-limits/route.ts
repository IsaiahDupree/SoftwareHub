import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateActivationToken } from '@/lib/licenses/token';
import { getAutoCommentLimits, getAutoDMLimits } from '@/lib/licenses/tier-limits';
import { z } from 'zod';

export const runtime = 'nodejs';

// Package slugs that support tier-based limits
const PACKAGE_SLUG_MAP: Record<string, string> = {
  'auto-comment': 'auto-comment',
  'auto-dm': 'auto-dm',
};

const QuerySchema = z.object({
  activation_token: z.string().min(1),
  package_slug: z.enum(['auto-comment', 'auto-dm']),
});

/**
 * GET /api/licenses/tier-limits
 *
 * Returns the tier-based feature limits for a given package and license.
 * Called by Electron apps (Auto Comment, Auto DM) on launch to enforce limits.
 *
 * Query params:
 *   activation_token - the JWT activation token
 *   package_slug     - the package slug (auto-comment or auto-dm)
 *
 * Returns:
 *   { tier, limits: TierLimits, subscription: { active, expires_at } }
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawParams = {
    activation_token: searchParams.get('activation_token') ?? '',
    package_slug: searchParams.get('package_slug') ?? '',
  };

  const parsed = QuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { activation_token, package_slug } = parsed.data;

  // Validate the activation token
  let payload: Awaited<ReturnType<typeof validateActivationToken>>;
  try {
    payload = await validateActivationToken(activation_token);
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired activation token', code: 'TOKEN_INVALID' },
      { status: 401 }
    );
  }

  // Look up the license to get current tier and subscription status
  const { data: license, error: licError } = await supabaseAdmin
    .from('licenses')
    .select('id, license_type, status, expires_at, package_id')
    .eq('id', payload.lid)
    .single();

  if (licError || !license) {
    return NextResponse.json(
      { error: 'License not found', code: 'LICENSE_NOT_FOUND' },
      { status: 404 }
    );
  }

  if (license.status === 'revoked' || license.status === 'suspended') {
    return NextResponse.json(
      { error: 'License is not active', code: 'LICENSE_INACTIVE' },
      { status: 403 }
    );
  }

  // Verify the license belongs to the requested package
  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('slug')
    .eq('id', license.package_id)
    .single();

  if (!pkg || PACKAGE_SLUG_MAP[package_slug] !== pkg.slug) {
    return NextResponse.json(
      { error: 'License does not match package', code: 'PACKAGE_MISMATCH' },
      { status: 403 }
    );
  }

  const tier = (license.license_type ?? 'starter').toLowerCase();

  // Get tier limits based on the package
  const limits =
    package_slug === 'auto-comment'
      ? getAutoCommentLimits(tier)
      : getAutoDMLimits(tier);

  // Check subscription active status
  const now = new Date();
  const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
  const subscriptionActive = !expiresAt || expiresAt > now;

  return NextResponse.json({
    tier,
    limits,
    subscription: {
      active: subscriptionActive,
      expires_at: license.expires_at ?? null,
    },
  });
}
