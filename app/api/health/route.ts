import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/health - Health check endpoint
 *
 * Used by Vercel /healthz rewrite and monitoring.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  });
}
