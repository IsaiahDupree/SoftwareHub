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

const UpdateBundleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  price_cents: z.number().int().min(0).optional(),
  compare_at_cents: z.number().int().min(0).nullable().optional(),
  stripe_product_id: z.string().nullable().optional(),
  stripe_price_id: z.string().nullable().optional(),
  icon_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  features: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  package_ids: z.array(z.string().uuid()).min(1).optional(),
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
    .from('package_bundles')
    .select(`
      *,
      package_bundle_items (
        package_id,
        sort_order,
        packages:package_id ( id, name, slug, icon_url, price_cents )
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  return NextResponse.json({ bundle: data });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = UpdateBundleSchema.parse(body);

    const { package_ids, ...bundleData } = validated;

    // Set published_at on first publish
    const updateData: Record<string, unknown> = { ...bundleData };
    if (bundleData.is_published) {
      const { data: existing } = await supabaseAdmin
        .from('package_bundles')
        .select('published_at')
        .eq('id', params.id)
        .single();

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabaseAdmin
      .from('package_bundles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bundle:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update bundle items if provided
    if (package_ids) {
      // Remove existing items
      await supabaseAdmin
        .from('package_bundle_items')
        .delete()
        .eq('bundle_id', params.id);

      // Insert new items
      const items = package_ids.map((pid, idx) => ({
        bundle_id: params.id,
        package_id: pid,
        sort_order: idx,
      }));

      await supabaseAdmin.from('package_bundle_items').insert(items);
    }

    return NextResponse.json({ bundle: data });
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
    .from('package_bundles')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
