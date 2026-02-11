import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/referrals - Get current user's referral code and stats
 */
export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Get or create referral code
  let { data: referralCode } = await supabaseAdmin
    .from('referral_codes')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!referralCode) {
    // Generate a new referral code
    const { data: code } = await supabaseAdmin.rpc('generate_referral_code', {
      p_user_id: user.id,
    });

    const { data: newCode, error } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code: code || `REF${user.id.slice(0, 6).toUpperCase()}`,
      })
      .select()
      .single();

    if (error) {
      // Code might already exist due to race condition
      const { data: existing } = await supabaseAdmin
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();
      referralCode = existing;
    } else {
      referralCode = newCode;
    }
  }

  // Get conversion stats
  const { data: conversions } = await supabaseAdmin
    .from('referral_conversions')
    .select('id, status, reward_amount, converted_at, referred_email')
    .eq('referrer_id', user.id)
    .order('converted_at', { ascending: false })
    .limit(50);

  // Get balance
  const { data: balance } = await supabaseAdmin.rpc('get_referral_balance', {
    p_user_id: user.id,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2828';
  const referralLink = referralCode
    ? `${siteUrl}/?ref=${referralCode.code}`
    : null;

  return NextResponse.json({
    referral_code: referralCode?.code || null,
    referral_link: referralLink,
    is_active: referralCode?.is_active ?? true,
    conversions: conversions || [],
    stats: {
      total_referrals: conversions?.length || 0,
      qualified: conversions?.filter((c) => c.status === 'qualified' || c.status === 'rewarded').length || 0,
      rewarded: conversions?.filter((c) => c.status === 'rewarded').length || 0,
    },
    balance_cents: balance || 0,
  });
}

/**
 * POST /api/referrals - Create/regenerate referral code
 */
export async function POST() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if user already has a code
  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a referral code. Use GET to retrieve it.' },
      { status: 400 }
    );
  }

  const { data: code } = await supabaseAdmin.rpc('generate_referral_code', {
    p_user_id: user.id,
  });

  const { data: referralCode, error } = await supabaseAdmin
    .from('referral_codes')
    .insert({
      user_id: user.id,
      code: code || `REF${user.id.slice(0, 6).toUpperCase()}`,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2828';

  return NextResponse.json({
    referral_code: referralCode.code,
    referral_link: `${siteUrl}/?ref=${referralCode.code}`,
  });
}
