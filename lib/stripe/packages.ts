import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function createStripeProductForPackage(packageId: string) {
  const { data: pkg, error } = await supabaseAdmin
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (error || !pkg) {
    throw new Error('Package not found');
  }

  // Create Stripe product
  const product = await stripe.products.create({
    name: pkg.name,
    description: pkg.tagline || pkg.description || undefined,
    metadata: {
      package_id: pkg.id,
      package_slug: pkg.slug,
      type: pkg.type,
    },
  });

  // Create Stripe price if price_cents is set
  let priceId: string | null = null;
  if (pkg.price_cents && pkg.price_cents > 0) {
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.price_cents,
      currency: 'usd',
    });
    priceId = price.id;
  }

  // Update package with Stripe IDs
  await supabaseAdmin
    .from('packages')
    .update({
      stripe_product_id: product.id,
      stripe_price_id: priceId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packageId);

  return { productId: product.id, priceId };
}
