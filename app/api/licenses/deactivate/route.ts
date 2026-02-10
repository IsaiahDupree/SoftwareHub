import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateActivationToken } from '@/lib/licenses/token';
import { hashDeviceId } from '@/lib/licenses/hash';
import { z } from 'zod';

export const runtime = 'nodejs';

const DeactivateSchema = z.object({
  activation_token: z.string().optional(),
  license_id: z.string().uuid().optional(),
  device_id: z.string().optional(),
}).refine(
  (data) => data.activation_token || (data.license_id && data.device_id),
  { message: 'Provide either activation_token or both license_id and device_id' }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = DeactivateSchema.parse(body);

    let licenseId: string;
    let deviceIdHash: string;

    if (validated.activation_token) {
      // Decode token to get license and device info
      try {
        const payload = await validateActivationToken(validated.activation_token);
        licenseId = payload.lid;
        deviceIdHash = payload.did;
      } catch {
        return NextResponse.json(
          { error: 'Invalid activation token' },
          { status: 401 }
        );
      }
    } else {
      licenseId = validated.license_id!;
      deviceIdHash = hashDeviceId(validated.device_id!);
    }

    // Find and deactivate the device
    const { data: activation, error: findError } = await supabaseAdmin
      .from('device_activations')
      .select('*')
      .eq('license_id', licenseId)
      .eq('device_id_hash', deviceIdHash)
      .eq('is_active', true)
      .single();

    if (findError || !activation) {
      return NextResponse.json(
        { error: 'Active device not found' },
        { status: 404 }
      );
    }

    // Deactivate the device
    await supabaseAdmin
      .from('device_activations')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', activation.id);

    // Decrement active devices count
    const { data: license } = await supabaseAdmin
      .from('licenses')
      .select('active_devices')
      .eq('id', licenseId)
      .single();

    if (license) {
      await supabaseAdmin
        .from('licenses')
        .update({
          active_devices: Math.max(0, license.active_devices - 1),
        })
        .eq('id', licenseId);
    }

    // Get remaining device count
    const { count } = await supabaseAdmin
      .from('device_activations')
      .select('id', { count: 'exact' })
      .eq('license_id', licenseId)
      .eq('is_active', true);

    return NextResponse.json({
      deactivated: true,
      remaining_devices: count || 0,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Deactivation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
