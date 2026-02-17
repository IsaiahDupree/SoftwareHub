import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const DetectSchema = z.object({
  image_url: z.string().url().optional(),
  image_base64: z.string().optional(),
  confidence_threshold: z.number().min(0.1).max(1.0).default(0.7),
}).refine(data => data.image_url || data.image_base64, {
  message: 'Either image_url or image_base64 is required',
});

// POST /api/watermark/detect - AI watermark region detection preview (WR-008)
// This endpoint validates the license and returns detection metadata.
// Actual AI inference runs in the Electron app locally via Python backend.
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user has Watermark Remover Pro or Team license (AI detection is Pro+)
  const { data: license } = await supabase
    .from('licenses')
    .select('id, license_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('license_type', ['pro', 'team'])
    .single();

  if (!license) {
    return NextResponse.json({
      error: 'Watermark Remover Pro or Team license required for AI detection',
      code: 'UPGRADE_REQUIRED',
    }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = DetectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  // For the web-based detection preview, we validate the request and return
  // configuration for the Electron app to run local AI inference.
  // In a full deployment, this would call an AI inference service.
  return NextResponse.json({
    detection_enabled: true,
    license_tier: license.license_type,
    confidence_threshold: parsed.data.confidence_threshold,
    model_version: '2.1.0',
    inference_endpoint: process.env.WATERMARK_AI_ENDPOINT ?? 'local',
    // Detection results are returned by the local Electron app
    // which runs the Python AI model directly
    instructions: {
      mode: process.env.WATERMARK_AI_ENDPOINT ? 'cloud' : 'local',
      message: 'Run AI detection in the desktop application for best performance',
    },
  });
}

// GET /api/watermark/detect/models - List available detection models (WR-008)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    models: [
      {
        id: 'general-v2',
        name: 'General Watermark Detector',
        description: 'Detects most common watermarks including text, logos, and overlays',
        accuracy: '94%',
        speed: 'fast',
        tier: 'pro',
      },
      {
        id: 'stock-photo-v1',
        name: 'Stock Photo Specialist',
        description: 'Optimized for Getty, Shutterstock, Adobe Stock, and similar watermarks',
        accuracy: '98%',
        speed: 'fast',
        tier: 'pro',
      },
      {
        id: 'custom',
        name: 'Custom Detector',
        description: 'Train your own detector for specific watermarks you encounter frequently',
        accuracy: 'varies',
        speed: 'medium',
        tier: 'team',
      },
    ],
  });
}
