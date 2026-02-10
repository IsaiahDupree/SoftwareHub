import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  // Get all published packages with their latest status check
  const { data: packages, error } = await supabaseAdmin
    .from('packages')
    .select(`
      id,
      name,
      slug,
      icon_url,
      status,
      type
    `)
    .eq('is_published', true)
    .order('name');

  if (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get latest status check for each package
  const packageIds = (packages ?? []).map((p) => p.id);

  const { data: latestChecks } = await supabaseAdmin
    .from('status_checks')
    .select('*')
    .in('package_id', packageIds.length ? packageIds : ['00000000-0000-0000-0000-000000000000'])
    .order('checked_at', { ascending: false });

  // Deduplicate to get only latest check per package
  const checkMap = new Map<string, typeof latestChecks extends (infer T)[] | null ? T : never>();
  (latestChecks ?? []).forEach((check) => {
    if (!checkMap.has(check.package_id)) {
      checkMap.set(check.package_id, check);
    }
  });

  const statuses = (packages ?? []).map((pkg) => {
    const check = checkMap.get(pkg.id);
    return {
      package_id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      icon_url: pkg.icon_url,
      type: pkg.type,
      status: pkg.status,
      last_check: check
        ? {
            status: check.status,
            response_time_ms: check.response_time_ms,
            checked_at: check.checked_at,
            message: check.status_message,
          }
        : null,
    };
  });

  // Calculate overall status
  const hasDown = statuses.some((s) => s.status === 'down');
  const hasDegraded = statuses.some((s) => s.status === 'degraded');
  const hasMaintenance = statuses.some((s) => s.status === 'maintenance');

  let overallStatus = 'operational';
  if (hasDown) overallStatus = 'major_outage';
  else if (hasDegraded) overallStatus = 'partial_outage';
  else if (hasMaintenance) overallStatus = 'maintenance';

  return NextResponse.json({
    overall_status: overallStatus,
    packages: statuses,
    checked_at: new Date().toISOString(),
  });
}
