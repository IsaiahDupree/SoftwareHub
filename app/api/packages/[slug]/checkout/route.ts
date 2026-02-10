import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

interface RouteParams {
  params: { slug: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Get the package
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (!pkg.stripe_price_id) {
      return NextResponse.json(
        { error: 'Package is not available for purchase' },
        { status: 400 }
      );
    }

    // Check if user already has entitlement
    if (user) {
      const { data: existing } = await supabaseAdmin
        .from('package_entitlements')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_id', pkg.id)
        .eq('has_access', true)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'You already own this package' },
          { status: 400 }
        );
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2828';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
      success_url: `${siteUrl}/thanks/package?session_id={CHECKOUT_SESSION_ID}&package=${pkg.slug}`,
      cancel_url: `${siteUrl}/packages/${pkg.slug}`,
      metadata: {
        kind: 'package',
        package_id: pkg.id,
        package_slug: pkg.slug,
        user_id: user?.id ?? '',
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Package checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
