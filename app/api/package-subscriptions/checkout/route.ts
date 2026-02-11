import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const CheckoutSchema = z.object({
  tierSlug: z.string().min(1),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Support both JSON and form data submissions
    let rawBody: Record<string, unknown>;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawBody = Object.fromEntries(formData.entries());
    } else {
      rawBody = await req.json();
    }
    const { tierSlug, billingPeriod } = CheckoutSchema.parse(rawBody);

    // Get the subscription tier
    const { data: tier, error: tierError } = await supabase
      .from('package_subscription_tiers')
      .select('*')
      .eq('slug', tierSlug)
      .eq('is_published', true)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Subscription tier not found' }, { status: 404 });
    }

    const priceId = billingPeriod === 'yearly'
      ? tier.stripe_price_id_yearly
      : tier.stripe_price_id_monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: `${billingPeriod} billing not available for this tier` },
        { status: 400 }
      );
    }

    // Check if user already has an active package subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status, stripe_customer_id')
      .eq('user_id', user.id)
      .not('package_subscription_tier_id', 'is', null)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active package subscription' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;

    const { data: anySub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (anySub?.stripe_customer_id) {
      stripeCustomerId = anySub.stripe_customer_id;
    } else {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: { user_id: user.id },
        });
        stripeCustomerId = customer.id;
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2828';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/app/products?subscription=success`,
      cancel_url: `${siteUrl}/pricing/packages?canceled=true`,
      metadata: {
        kind: 'package_subscription',
        user_id: user.id,
        tier_id: tier.id,
        tier_slug: tier.slug,
        includes_all_packages: String(tier.includes_all_packages),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          kind: 'package_subscription',
          tier_id: tier.id,
          tier_slug: tier.slug,
          includes_all_packages: String(tier.includes_all_packages),
        },
      },
      allow_promotion_codes: true,
    });

    // For form submissions, redirect directly to Stripe
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      return NextResponse.redirect(session.url!, 303);
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Package subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
