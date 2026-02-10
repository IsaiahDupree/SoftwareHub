import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createHash } from 'crypto';

interface RouteParams {
  params: { id: string };
}

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

export async function POST(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Verify release exists
    const { data: release, error: releaseError } = await supabaseAdmin
      .from('package_releases')
      .select('id, package_id')
      .eq('id', params.id)
      .single();

    if (releaseError || !release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file for checksum calculation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate SHA256 checksum
    const hash = createHash('sha256');
    hash.update(buffer);
    const checksum = hash.digest('hex');

    // For now, store in Supabase storage (can be migrated to R2 later)
    const fileName = `${release.package_id}/${release.id}/${file.name}`;
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('releases')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('releases')
      .getPublicUrl(fileName);

    // Update release with file info
    const { data: updatedRelease, error: updateError } = await supabaseAdmin
      .from('package_releases')
      .update({
        download_url: urlData.publicUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        checksum_sha256: checksum,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating release:', updateError);
      return NextResponse.json({ error: 'Failed to update release' }, { status: 500 });
    }

    return NextResponse.json({ release: updatedRelease });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
