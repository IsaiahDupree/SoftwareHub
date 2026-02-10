import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createStatusChangeActivity } from '@/lib/activity/create';

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

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const packageId = body.package_id;

  if (!packageId) {
    return NextResponse.json({ error: 'package_id required' }, { status: 400 });
  }

  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('id, name, status, status_check_url')
    .eq('id', packageId)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  const result = await performStatusCheck(pkg);

  return NextResponse.json({ check: result });
}

async function performStatusCheck(pkg: {
  id: string;
  name: string;
  status: string;
  status_check_url: string | null;
}) {
  if (!pkg.status_check_url) {
    return { status: 'skipped', message: 'No status check URL configured' };
  }

  const startTime = Date.now();
  let newStatus = 'operational';
  let responseTimeMs: number | null = null;
  let statusMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(pkg.status_check_url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    responseTimeMs = Date.now() - startTime;

    if (res.ok) {
      newStatus = responseTimeMs > 5000 ? 'degraded' : 'operational';
      statusMessage = `HTTP ${res.status} in ${responseTimeMs}ms`;
    } else {
      newStatus = 'degraded';
      statusMessage = `HTTP ${res.status}`;
    }
  } catch (err) {
    responseTimeMs = Date.now() - startTime;
    newStatus = 'down';
    statusMessage = err instanceof Error ? err.message : 'Connection failed';
  }

  // Record status check
  const { data: check } = await supabaseAdmin
    .from('status_checks')
    .insert({
      package_id: pkg.id,
      status: newStatus,
      response_time_ms: responseTimeMs,
      status_message: statusMessage,
      check_type: 'manual',
    })
    .select()
    .single();

  // Update package status if changed
  if (newStatus !== pkg.status) {
    await supabaseAdmin
      .from('packages')
      .update({ status: newStatus })
      .eq('id', pkg.id);

    // Create activity for status change
    await createStatusChangeActivity(pkg.id, pkg.name, newStatus, statusMessage || undefined);
  }

  return check;
}

// Export for use by cron
export { performStatusCheck };
