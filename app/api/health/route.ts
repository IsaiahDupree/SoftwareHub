import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health - Health check endpoint
 *
 * Used by Vercel /healthz rewrite and monitoring.
 */
export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Check database connectivity
  try {
    const start = Date.now();
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.from('users').select('count').limit(1).single();
    checks.database = { status: 'healthy', latency: Date.now() - start };
  } catch {
    checks.database = { status: 'unhealthy' };
  }

  // Basic app health
  checks.app = { status: 'healthy' };
  checks.memory = {
    status: 'healthy',
    latency: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  };

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
