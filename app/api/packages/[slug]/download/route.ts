import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get package by slug
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from('packages')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  // Check entitlement
  const { data: entitlement } = await supabaseAdmin
    .from('package_entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('package_id', pkg.id)
    .eq('has_access', true)
    .maybeSingle();

  if (!entitlement) {
    return NextResponse.json(
      { error: 'No access to this package', code: 'NO_ENTITLEMENT' },
      { status: 403 }
    );
  }

  // Get version parameter (default to current release)
  const { searchParams } = new URL(req.url);
  const version = searchParams.get('version');
  const channel = searchParams.get('channel') || 'stable';

  let releaseQuery = supabaseAdmin
    .from('package_releases')
    .select('*')
    .eq('package_id', pkg.id)
    .eq('is_yanked', false);

  if (version) {
    releaseQuery = releaseQuery.eq('version', version);
  } else {
    releaseQuery = releaseQuery
      .eq('channel', channel)
      .eq('is_current', true);
  }

  const { data: release, error: relError } = await releaseQuery.single();

  if (relError || !release) {
    return NextResponse.json(
      { error: 'No release available' },
      { status: 404 }
    );
  }

  if (!release.download_url) {
    return NextResponse.json(
      { error: 'Download not available for this release' },
      { status: 404 }
    );
  }

  // Generate signed URL if using Supabase storage
  let downloadUrl = release.download_url;

  if (release.download_url.startsWith('packages/')) {
    // It's a Supabase storage path - generate signed URL (1hr expiry)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('releases')
      .createSignedUrl(release.download_url, 3600);

    if (signError || !signedData) {
      console.error('Error creating signed URL:', signError);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }
    downloadUrl = signedData.signedUrl;
  }

  // Log download attempt
  await supabaseAdmin.from('download_logs').insert({
    user_id: user.id,
    package_id: pkg.id,
    release_id: release.id,
    version: release.version,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
    user_agent: req.headers.get('user-agent') || null,
    status: 'started',
  });

  // Increment download count
  await supabaseAdmin
    .from('package_releases')
    .update({ download_count: (release.download_count || 0) + 1 })
    .eq('id', release.id);

  return NextResponse.json({
    download_url: downloadUrl,
    version: release.version,
    file_size: release.file_size,
    checksum_sha256: release.checksum_sha256,
    release_notes: release.release_notes,
    channel: release.channel,
    published_at: release.published_at,
  });
}
