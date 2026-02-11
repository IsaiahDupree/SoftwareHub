/**
 * Stripe Product Setup Script
 *
 * Creates Stripe products and prices for all packages, bundles, and subscription tiers.
 * Run after configuring STRIPE_SECRET_KEY with your live/test key.
 *
 * Usage:
 *   npx ts-node scripts/setup-stripe-products.ts [--dry-run]
 *
 * This script reads packages, bundles, and subscription tiers from Supabase
 * and creates corresponding Stripe products and prices, then updates the
 * database with the Stripe IDs.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupPackages() {
  console.log('\n=== Setting up Package Products ===\n');

  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, slug, tagline, price_cents, stripe_price_id')
    .eq('is_published', true)
    .order('name');

  if (!packages?.length) {
    console.log('No published packages found.');
    return;
  }

  for (const pkg of packages) {
    if (pkg.stripe_price_id) {
      console.log(`  ✓ ${pkg.name} - already has Stripe price: ${pkg.stripe_price_id}`);
      continue;
    }

    if (!pkg.price_cents || pkg.price_cents <= 0) {
      console.log(`  ⚠ ${pkg.name} - no price set, skipping`);
      continue;
    }

    console.log(`  → ${pkg.name} ($${(pkg.price_cents / 100).toFixed(2)})`);

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would create product and price`);
      continue;
    }

    const product = await stripe.products.create({
      name: pkg.name,
      description: pkg.tagline || undefined,
      metadata: {
        softwarehub_id: pkg.id,
        softwarehub_slug: pkg.slug,
        kind: 'package',
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.price_cents,
      currency: 'usd',
      metadata: { softwarehub_package_id: pkg.id },
    });

    await supabase
      .from('packages')
      .update({ stripe_price_id: price.id })
      .eq('id', pkg.id);

    console.log(`    ✓ Created product ${product.id}, price ${price.id}`);
  }
}

async function setupBundles() {
  console.log('\n=== Setting up Bundle Products ===\n');

  const { data: bundles } = await supabase
    .from('package_bundles')
    .select('id, name, slug, description, price_cents, stripe_price_id')
    .eq('is_published', true)
    .order('name');

  if (!bundles?.length) {
    console.log('No published bundles found.');
    return;
  }

  for (const bundle of bundles) {
    if (bundle.stripe_price_id) {
      console.log(`  ✓ ${bundle.name} - already has Stripe price: ${bundle.stripe_price_id}`);
      continue;
    }

    if (!bundle.price_cents || bundle.price_cents <= 0) {
      console.log(`  ⚠ ${bundle.name} - no price set, skipping`);
      continue;
    }

    console.log(`  → ${bundle.name} ($${(bundle.price_cents / 100).toFixed(2)})`);

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would create product and price`);
      continue;
    }

    const product = await stripe.products.create({
      name: bundle.name,
      description: bundle.description || undefined,
      metadata: {
        softwarehub_id: bundle.id,
        softwarehub_slug: bundle.slug,
        kind: 'package_bundle',
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: bundle.price_cents,
      currency: 'usd',
      metadata: { softwarehub_bundle_id: bundle.id },
    });

    await supabase
      .from('package_bundles')
      .update({ stripe_price_id: price.id })
      .eq('id', bundle.id);

    console.log(`    ✓ Created product ${product.id}, price ${price.id}`);
  }
}

async function setupSubscriptionTiers() {
  console.log('\n=== Setting up Subscription Tier Products ===\n');

  const { data: tiers } = await supabase
    .from('package_subscription_tiers')
    .select('id, name, slug, description, price_cents_monthly, price_cents_yearly, stripe_price_id_monthly, stripe_price_id_yearly')
    .eq('is_published', true)
    .order('name');

  if (!tiers?.length) {
    console.log('No published subscription tiers found.');
    return;
  }

  for (const tier of tiers) {
    console.log(`  → ${tier.name}`);

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would create product and prices`);
      continue;
    }

    // Create product if needed (check if monthly price exists as proxy)
    let productId: string;

    if (tier.stripe_price_id_monthly) {
      const existingPrice = await stripe.prices.retrieve(tier.stripe_price_id_monthly);
      productId = existingPrice.product as string;
      console.log(`    ✓ Using existing product ${productId}`);
    } else {
      const product = await stripe.products.create({
        name: `${tier.name} Subscription`,
        description: tier.description || undefined,
        metadata: {
          softwarehub_tier_id: tier.id,
          softwarehub_slug: tier.slug,
          kind: 'package_subscription',
        },
      });
      productId = product.id;
      console.log(`    ✓ Created product ${productId}`);
    }

    // Create monthly price if needed
    if (!tier.stripe_price_id_monthly && tier.price_cents_monthly > 0) {
      const monthlyPrice = await stripe.prices.create({
        product: productId,
        unit_amount: tier.price_cents_monthly,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { softwarehub_tier_id: tier.id, period: 'monthly' },
      });

      await supabase
        .from('package_subscription_tiers')
        .update({ stripe_price_id_monthly: monthlyPrice.id })
        .eq('id', tier.id);

      console.log(`    ✓ Monthly price: ${monthlyPrice.id} ($${(tier.price_cents_monthly / 100).toFixed(2)}/mo)`);
    }

    // Create yearly price if needed
    if (!tier.stripe_price_id_yearly && tier.price_cents_yearly && tier.price_cents_yearly > 0) {
      const yearlyPrice = await stripe.prices.create({
        product: productId,
        unit_amount: tier.price_cents_yearly,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { softwarehub_tier_id: tier.id, period: 'yearly' },
      });

      await supabase
        .from('package_subscription_tiers')
        .update({ stripe_price_id_yearly: yearlyPrice.id })
        .eq('id', tier.id);

      console.log(`    ✓ Yearly price: ${yearlyPrice.id} ($${(tier.price_cents_yearly / 100).toFixed(2)}/yr)`);
    }
  }
}

async function setupWebhook() {
  console.log('\n=== Webhook Configuration ===\n');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || siteUrl.includes('localhost')) {
    console.log('  ⚠ NEXT_PUBLIC_SITE_URL is localhost - skipping webhook setup');
    console.log('  → Create webhook manually at https://dashboard.stripe.com/webhooks');
    console.log(`  → Endpoint URL: ${siteUrl || 'https://yourdomain.com'}/api/stripe/webhook`);
    console.log('  → Events: checkout.session.completed, customer.subscription.created,');
    console.log('            customer.subscription.updated, customer.subscription.deleted');
    return;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create webhook endpoint: ${siteUrl}/api/stripe/webhook`);
    return;
  }

  // Check if webhook already exists
  const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = webhooks.data.find(
    (w) => w.url === `${siteUrl}/api/stripe/webhook`
  );

  if (existing) {
    console.log(`  ✓ Webhook already exists: ${existing.id}`);
    console.log(`    URL: ${existing.url}`);
    console.log(`    Status: ${existing.status}`);
    return;
  }

  const webhook = await stripe.webhookEndpoints.create({
    url: `${siteUrl}/api/stripe/webhook`,
    enabled_events: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
    metadata: { app: 'softwarehub' },
  });

  console.log(`  ✓ Created webhook: ${webhook.id}`);
  console.log(`    URL: ${webhook.url}`);
  console.log(`    Secret: ${webhook.secret}`);
  console.log('');
  console.log('  ⚠ IMPORTANT: Set STRIPE_WEBHOOK_SECRET to the secret above in your environment!');
}

async function main() {
  console.log('=============================================');
  console.log('  SoftwareHub Stripe Product Setup');
  console.log('=============================================');

  if (DRY_RUN) {
    console.log('\n  *** DRY RUN MODE - No changes will be made ***\n');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY is not set');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Supabase environment variables are not set');
    process.exit(1);
  }

  const isLive = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
  console.log(`\n  Mode: ${isLive ? '🔴 LIVE' : '🟡 TEST'}`);

  await setupPackages();
  await setupBundles();
  await setupSubscriptionTiers();
  await setupWebhook();

  console.log('\n=============================================');
  console.log('  Setup Complete!');
  console.log('=============================================\n');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
