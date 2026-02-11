import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

async function checkAdmin(supabase: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

const CreateTierSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  price_cents_monthly: z.number().int().min(0),
  price_cents_yearly: z.number().int().min(0).nullable().optional(),
  stripe_price_id_monthly: z.string().nullable().optional(),
  stripe_price_id_yearly: z.string().nullable().optional(),
  stripe_product_id: z.string().nullable().optional(),
  includes_all_packages: z.boolean().default(true),
  included_package_ids: z.array(z.string().uuid()).optional(),
  max_devices_per_license: z.number().int().min(1).max(10).default(3),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export async function GET() {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('package_subscription_tiers')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscription tiers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tiers: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = CreateTierSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('package_subscription_tiers')
      .insert({
        ...validated,
        features: validated.features || [],
        included_package_ids: validated.included_package_ids || [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A tier with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tier: data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
