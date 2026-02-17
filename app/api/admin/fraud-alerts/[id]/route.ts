// app/api/admin/fraud-alerts/[id]/route.ts
// Resolve or update a specific fraud alert
// LIC-006

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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

const UpdateAlertSchema = z.object({
  resolved: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const validated = UpdateAlertSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (validated.resolved !== undefined) {
      updates.resolved = validated.resolved;
      updates.resolved_by = validated.resolved ? user.id : null;
      updates.resolved_at = validated.resolved ? new Date().toISOString() : null;
    }
    if (validated.notes !== undefined) {
      updates.notes = validated.notes;
    }

    const { data, error } = await supabaseAdmin
      .from('license_fraud_alerts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alert: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Error updating fraud alert:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
