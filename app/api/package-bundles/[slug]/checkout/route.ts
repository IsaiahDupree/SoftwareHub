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

    // Get the bundle with its items
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('package_bundles')
      .select(`
        *,
        package_bundle_items (
          package_id,
          packages:package_id ( id, name, slug )
        )
      `)
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single();

    if (bundleError || !bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    if (!bundle.stripe_price_id) {
      return NextResponse.json(
        { error: 'Bundle is not available for purchase' },
        { status: 400 }
      );
    }

    const packageIds = (bundle.package_bundle_items || []).map(
      (item: { package_id: string }) => item.package_id
    );

    // Check if user already has all packages in the bundle
    if (user && packageIds.length > 0) {
      const { data: existingEntitlements } = await supabaseAdmin
        .from('package_entitlements')
        .select('package_id')
        .eq('user_id', user.id)
        .eq('has_access', true)
        .in('package_id', packageIds);

      if (existingEntitlements && existingEntitlements.length === packageIds.length) {
        return NextResponse.json(
          { error: 'You already own all packages in this bundle' },
          { status: 400 }
        );
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2828';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: bundle.stripe_price_id, quantity: 1 }],
      success_url: `${siteUrl}/thanks/package?session_id={CHECKOUT_SESSION_ID}&bundle=${bundle.slug}`,
      cancel_url: `${siteUrl}/bundles/packages/${bundle.slug}`,
      metadata: {
        kind: 'package_bundle',
        package_bundle_id: bundle.id,
        package_bundle_slug: bundle.slug,
        package_ids: JSON.stringify(packageIds),
        user_id: user?.id ?? '',
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Package bundle checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
