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

const CreateBundleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  price_cents: z.number().int().min(0),
  compare_at_cents: z.number().int().min(0).nullable().optional(),
  stripe_product_id: z.string().nullable().optional(),
  stripe_price_id: z.string().nullable().optional(),
  icon_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  features: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  package_ids: z.array(z.string().uuid()).min(1, "At least one package is required"),
});

export async function GET() {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('package_bundles')
    .select(`
      *,
      package_bundle_items (
        package_id,
        sort_order,
        packages:package_id ( id, name, slug, icon_url, price_cents )
      )
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching package bundles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bundles: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = CreateBundleSchema.parse(body);

    const { package_ids, ...bundleData } = validated;

    // Create the bundle
    const { data: bundle, error } = await supabaseAdmin
      .from('package_bundles')
      .insert({
        ...bundleData,
        features: bundleData.features || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating package bundle:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A bundle with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert bundle items
    const items = package_ids.map((pid, idx) => ({
      bundle_id: bundle.id,
      package_id: pid,
      sort_order: idx,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('package_bundle_items')
      .insert(items);

    if (itemsError) {
      console.error('Error creating bundle items:', itemsError);
      // Clean up the bundle
      await supabaseAdmin.from('package_bundles').delete().eq('id', bundle.id);
      return NextResponse.json({ error: 'Failed to add packages to bundle' }, { status: 500 });
    }

    return NextResponse.json({ bundle }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
