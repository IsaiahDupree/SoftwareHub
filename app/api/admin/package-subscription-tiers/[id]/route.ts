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

const UpdateTierSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  price_cents_monthly: z.number().int().min(0).optional(),
  price_cents_yearly: z.number().int().min(0).nullable().optional(),
  stripe_price_id_monthly: z.string().nullable().optional(),
  stripe_price_id_yearly: z.string().nullable().optional(),
  stripe_product_id: z.string().nullable().optional(),
  includes_all_packages: z.boolean().optional(),
  included_package_ids: z.array(z.string().uuid()).optional(),
  max_devices_per_license: z.number().int().min(1).max(10).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('package_subscription_tiers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
  }

  return NextResponse.json({ tier: data });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = UpdateTierSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('package_subscription_tiers')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tier: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('package_subscription_tiers')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
