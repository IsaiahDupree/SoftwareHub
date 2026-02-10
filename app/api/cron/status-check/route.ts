import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createStatusChangeActivity } from '@/lib/activity/create';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel cron or manual trigger)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all packages with status check URLs
  const { data: packages } = await supabaseAdmin
    .from('packages')
    .select('id, name, status, status_check_url')
    .eq('is_published', true)
    .not('status_check_url', 'is', null);

  if (!packages || packages.length === 0) {
    return NextResponse.json({ message: 'No packages to check', checked: 0 });
  }

  const results = [];

  for (const pkg of packages) {
    if (!pkg.status_check_url) continue;

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
    await supabaseAdmin.from('status_checks').insert({
      package_id: pkg.id,
      status: newStatus,
      response_time_ms: responseTimeMs,
      status_message: statusMessage,
      check_type: 'automated',
    });

    // Update package status if changed
    if (newStatus !== pkg.status) {
      await supabaseAdmin
        .from('packages')
        .update({ status: newStatus })
        .eq('id', pkg.id);

      await createStatusChangeActivity(
        pkg.id,
        pkg.name,
        newStatus,
        statusMessage || undefined
      );
    }

    results.push({
      package_id: pkg.id,
      name: pkg.name,
      status: newStatus,
      response_time_ms: responseTimeMs,
      changed: newStatus !== pkg.status,
    });
  }

  return NextResponse.json({
    checked: results.length,
    results,
    checked_at: new Date().toISOString(),
  });
}
