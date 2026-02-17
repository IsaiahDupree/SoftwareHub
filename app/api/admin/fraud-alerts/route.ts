// app/api/admin/fraud-alerts/route.ts
// Admin API for license fraud alert management
// LIC-006

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getFraudStats } from '@/lib/licenses/fraud';

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

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  const resolved = searchParams.get('resolved');
  const minRisk = parseInt(searchParams.get('min_risk') || '0');

  let query = supabaseAdmin
    .from('license_fraud_alerts')
    .select(`
      *,
      licenses:license_id (id, license_type, status, packages:package_id (name, slug)),
      users:user_id (id, email, full_name)
    `, { count: 'exact' });

  if (resolved !== null) {
    query = query.eq('resolved', resolved === 'true');
  }

  if (minRisk > 0) {
    query = query.gte('risk_score', minRisk);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching fraud alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = await getFraudStats();

  return NextResponse.json({
    alerts: data ?? [],
    stats,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}
