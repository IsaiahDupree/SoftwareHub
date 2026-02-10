import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: licenses, error } = await supabase
    .from('licenses')
    .select(`
      id,
      package_id,
      license_key,
      license_type,
      max_devices,
      active_devices,
      status,
      created_at,
      activated_at,
      expires_at,
      source,
      packages (
        id,
        name,
        slug,
        type,
        icon_url,
        current_version
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask license keys: show only last 4 characters of the last group
  const maskedLicenses = (licenses ?? []).map((license) => ({
    ...license,
    license_key: maskLicenseKey(license.license_key),
  }));

  return NextResponse.json({ licenses: maskedLicenses });
}

function maskLicenseKey(key: string): string {
  // XXXX-XXXX-XXXX-XXXX -> ****-****-****-XXXX
  const parts = key.split('-');
  if (parts.length !== 4) return key;
  return `****-****-****-${parts[3]}`;
}
