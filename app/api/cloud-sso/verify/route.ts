import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifySSOToken } from '@/lib/cloud-sso/token';
import { z } from 'zod';

export const runtime = 'nodejs';

const VerifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = VerifySchema.parse(body);

    // Verify token
    let payload;
    try {
      payload = await verifySSOToken(token);
    } catch {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired SSO token' },
        { status: 401 }
      );
    }

    // Check if token has been used (one-time use)
    const { data: existing } = await supabaseAdmin
      .from('status_checks')
      .select('id')
      .eq('check_type', `sso:${payload.jti}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { valid: false, error: 'Token has already been used' },
        { status: 401 }
      );
    }

    // Mark token as used
    await supabaseAdmin.from('status_checks').insert({
      package_id: payload.pid,
      status: 'operational',
      check_type: `sso:${payload.jti}`,
      status_message: `SSO token used by ${payload.sub}`,
    });

    // Get user info
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', payload.sub)
      .single();

    return NextResponse.json({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        full_name: userProfile?.full_name || null,
        avatar_url: userProfile?.avatar_url || null,
      },
      package_id: payload.pid,
      entitlements: payload.ents,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('SSO verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
