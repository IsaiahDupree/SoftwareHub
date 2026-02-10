import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CreateReleaseSchema } from '@/lib/validation/packages';
import { createReleaseActivity } from '@/lib/activity/create';
import { notifyUsersOfNewRelease } from '@/lib/email/sendNewReleaseEmail';
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

export async function POST(request: Request) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = CreateReleaseSchema.parse(body);

    // If setting as current, unset other current releases for this package
    if (validated.is_current) {
      await supabaseAdmin
        .from('package_releases')
        .update({ is_current: false })
        .eq('package_id', validated.package_id)
        .eq('is_current', true);
    }

    const { data: release, error } = await supabaseAdmin
      .from('package_releases')
      .insert({
        ...validated,
        published_at: validated.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating release:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This version already exists for this package' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update package current version if this is the current release
    if (validated.is_current && release) {
      await supabaseAdmin
        .from('packages')
        .update({
          current_version: validated.version,
          current_release_id: release.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.package_id);
    }

    // Create activity feed entry for published releases
    if (validated.is_published) {
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('name, slug')
        .eq('id', validated.package_id)
        .single();

      if (pkg) {
        await createReleaseActivity(
          validated.package_id,
          pkg.name,
          pkg.slug,
          validated.version,
          validated.release_notes
        );

        // Send email notifications to users with entitlement (async, don't block response)
        notifyUsersOfNewRelease({
          packageId: validated.package_id,
          packageName: pkg.name,
          packageSlug: pkg.slug,
          version: validated.version,
          releaseNotes: validated.release_notes || '',
          channel: validated.channel || 'stable',
        }).catch((err) => console.error('Failed to send release notifications:', err));
      }
    }

    return NextResponse.json({ release }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
