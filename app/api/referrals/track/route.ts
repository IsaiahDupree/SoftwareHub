import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const TrackSchema = z.object({
  referral_code: z.string().min(1),
});

/**
 * POST /api/referrals/track - Track a referral conversion
 *
 * Called when a purchase is made by a referred user.
 * The referral_code is stored in a cookie and sent with the purchase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referral_code } = TrackSchema.parse(body);

    // Look up the referral code
    const { data: code } = await supabaseAdmin
      .from('referral_codes')
      .select('id, user_id, is_active')
      .eq('code', referral_code)
      .eq('is_active', true)
      .single();

    if (!code) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Return the referrer info (stored client-side for later attribution)
    return NextResponse.json({
      valid: true,
      referrer_id: code.user_id,
      code_id: code.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
  }
}
