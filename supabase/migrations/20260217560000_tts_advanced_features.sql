-- Migration: TTS Studio Advanced Features (TTS-009, TTS-010, TTS-011)
-- Voice cloning, batch audio generation, SSML editor

-- ============================================================
-- VOICE CLONING (TTS-009)
-- ============================================================

-- Voice clone models table
CREATE TABLE IF NOT EXISTS public.tts_voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'training' CHECK (status IN ('training', 'ready', 'failed', 'archived')),
  sample_audio_urls TEXT[] DEFAULT '{}',
  model_id TEXT, -- External model ID from TTS provider
  voice_characteristics JSONB DEFAULT '{}'::jsonb, -- pitch, speed, accent, gender
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tts_voice_clones_user_id ON public.tts_voice_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_voice_clones_status ON public.tts_voice_clones(status);

-- ============================================================
-- BATCH AUDIO GENERATION (TTS-010)
-- ============================================================

-- Batch TTS generation jobs
CREATE TABLE IF NOT EXISTS public.tts_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.licenses(id),
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- Voice ID or clone model ID
  items JSONB NOT NULL, -- Array of {id, text, output_filename}
  output_format TEXT DEFAULT 'mp3' CHECK (output_format IN ('mp3', 'aac', 'wav', 'ogg')),
  output_quality TEXT DEFAULT 'high' CHECK (output_quality IN ('standard', 'high', 'ultra')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  output_archive_url TEXT, -- ZIP file with all generated audio
  error_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tts_batch_jobs_user_id ON public.tts_batch_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tts_batch_jobs_status ON public.tts_batch_jobs(status);

-- ============================================================
-- SSML PRESETS (TTS-011)
-- ============================================================

-- SSML templates/presets for the SSML editor
CREATE TABLE IF NOT EXISTS public.tts_ssml_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system presets
  name TEXT NOT NULL,
  description TEXT,
  ssml_template TEXT NOT NULL,
  category TEXT, -- 'emphasis', 'pacing', 'pause', 'pronunciation', 'emotion'
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tts_ssml_presets_category ON public.tts_ssml_presets(category);

-- Seed system SSML presets
INSERT INTO public.tts_ssml_presets (id, name, description, ssml_template, category, is_public)
VALUES
(
  'ssml0001-0000-0000-0000-000000000001',
  'Dramatic Pause',
  'Add a natural pause between sentences for dramatic effect',
  '<speak>{before_text}<break time="1s"/>{after_text}</speak>',
  'pause',
  true
),
(
  'ssml0001-0000-0000-0000-000000000002',
  'Strong Emphasis',
  'Emphasize a key word or phrase strongly',
  '<speak><emphasis level="strong">{emphasized_text}</emphasis></speak>',
  'emphasis',
  true
),
(
  'ssml0001-0000-0000-0000-000000000003',
  'Slow and Clear',
  'Slow down speech rate for complex information or instructions',
  '<speak><prosody rate="slow">{text}</prosody></speak>',
  'pacing',
  true
),
(
  'ssml0001-0000-0000-0000-000000000004',
  'Excited Tone',
  'Higher pitch and faster rate for exciting announcements',
  '<speak><prosody pitch="high" rate="fast">{text}</prosody></speak>',
  'emotion',
  true
),
(
  'ssml0001-0000-0000-0000-000000000005',
  'Custom Pronunciation',
  'Override pronunciation for technical terms or brand names',
  '<speak><phoneme alphabet="ipa" ph="{ipa_pronunciation}">{word}</phoneme></speak>',
  'pronunciation',
  true
),
(
  'ssml0001-0000-0000-0000-000000000006',
  'Whisper Effect',
  'Whispered speech for dramatic effect',
  '<speak><amazon:effect name="whispered">{text}</amazon:effect></speak>',
  'emotion',
  true
)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.tts_voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_ssml_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own voice clones" ON public.tts_voice_clones
  FOR ALL USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users manage own voice clones" ON public.tts_voice_clones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own voice clones" ON public.tts_voice_clones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own voice clones" ON public.tts_voice_clones
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own batch jobs" ON public.tts_batch_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see public and own SSML presets" ON public.tts_ssml_presets
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users manage own SSML presets" ON public.tts_ssml_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

RAISE NOTICE 'TTS Studio advanced features: voice clones, batch jobs, SSML presets created';
