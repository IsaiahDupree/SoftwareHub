-- Migration: EverReach CRM SaaS Integration & Sora Video Features
-- CRM-001 to CRM-010, SORA-002 to SORA-009

-- ============================================================
-- EVERREACH CRM SAAS INTEGRATION (CRM-001 to CRM-005)
-- ============================================================

-- Multi-tenant CRM tenants table
CREATE TABLE IF NOT EXISTS public.crm_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_license_id UUID REFERENCES public.licenses(id),
  workspace_name TEXT NOT NULL,
  workspace_slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_tenants_user_id ON public.crm_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tenants_workspace_slug ON public.crm_tenants(workspace_slug);

-- CRM contacts (multi-tenant)
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.crm_tenants(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  source TEXT, -- 'manual', 'csv_import', 'vcard', 'api'
  warmth_score INTEGER DEFAULT 50 CHECK (warmth_score BETWEEN 0 AND 100),
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_id ON public.crm_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_warmth ON public.crm_contacts(tenant_id, warmth_score DESC);

-- CRM contact interactions (warmth score tracking)
CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.crm_tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'note', 'deal', 'social'
  summary TEXT,
  score_change INTEGER DEFAULT 0, -- positive or negative impact on warmth score
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_contact_id ON public.crm_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_tenant_id ON public.crm_interactions(tenant_id, created_at DESC);

-- CRM SSO tokens (for cloud SSO from SoftwareHub)
CREATE TABLE IF NOT EXISTS public.crm_sso_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.crm_tenants(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_sso_tokens_token ON public.crm_sso_tokens(token);

-- Row Level Security
ALTER TABLE public.crm_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sso_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tenant data
CREATE POLICY "Users see own CRM tenants" ON public.crm_tenants
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own CRM contacts" ON public.crm_contacts
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.crm_tenants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own CRM interactions" ON public.crm_interactions
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.crm_tenants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own SSO tokens" ON public.crm_sso_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Warmth score decay function (CRM-007)
-- Called by cron job daily to decay warmth scores for inactive contacts
CREATE OR REPLACE FUNCTION public.decay_crm_warmth_scores()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  -- Decay contacts not interacted with in 14+ days (lose 5 points per week)
  UPDATE public.crm_contacts
  SET
    warmth_score = GREATEST(0, warmth_score - 5),
    updated_at = NOW()
  WHERE
    last_contact_at < NOW() - INTERVAL '14 days'
    AND warmth_score > 0;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Set next_followup_at for contacts that dropped below 40 (cold threshold)
  UPDATE public.crm_contacts
  SET
    next_followup_at = NOW() + INTERVAL '7 days',
    updated_at = NOW()
  WHERE
    warmth_score < 40
    AND next_followup_at IS NULL
    AND last_contact_at < NOW() - INTERVAL '30 days';

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SORA VIDEO ADVANCED FEATURES (SORA-002 to SORA-009)
-- ============================================================

-- Sora video generation queue
CREATE TABLE IF NOT EXISTS public.sora_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.licenses(id),
  prompt TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 5,
  resolution TEXT DEFAULT '1080p', -- '480p', '720p', '1080p'
  aspect_ratio TEXT DEFAULT '16:9', -- '16:9', '9:16', '1:1'
  style_preset TEXT,
  reference_image_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  output_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sora_generations_user_id ON public.sora_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sora_generations_status ON public.sora_generations(status);

-- Sora video library (saved/tagged videos)
CREATE TABLE IF NOT EXISTS public.sora_video_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.sora_generations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  is_favorite BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sora_library_user_id ON public.sora_video_library(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sora_library_tags ON public.sora_video_library USING GIN (tags);

-- Sora prompt templates
CREATE TABLE IF NOT EXISTS public.sora_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system templates
  title TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- e.g. [{"name": "product", "type": "text"}]
  category TEXT, -- 'product_demo', 'lifestyle', 'testimonial', 'educational', 'entertainment'
  preview_url TEXT,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sora_templates_category ON public.sora_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_sora_templates_user_id ON public.sora_prompt_templates(user_id);

-- Seed default Sora prompt templates
INSERT INTO public.sora_prompt_templates (id, title, description, prompt_template, category, is_public, usage_count)
VALUES
(
  'tttt0001-0000-0000-0000-000000000001',
  'Product Showcase',
  'Professional product demonstration video',
  'A sleek product demonstration video showing {product_name} from multiple angles. Professional studio lighting, clean white background, smooth camera movement. The product {product_description}. 4K quality, commercial style.',
  'product_demo',
  true,
  0
),
(
  'tttt0001-0000-0000-0000-000000000002',
  'Lifestyle Integration',
  'Show a product in natural use',
  'A lifestyle video showing a person using {product_name} in a {setting} environment. Natural lighting, authentic feel. The person {action_description}. Warm, aspirational tone.',
  'lifestyle',
  true,
  0
),
(
  'tttt0001-0000-0000-0000-000000000003',
  'Educational Tutorial',
  'How-to style content',
  'A clean, professional tutorial video explaining {topic}. Screen recording style with annotations. Clear step-by-step progression. {steps_description}. Professional but approachable tone.',
  'educational',
  true,
  0
),
(
  'tttt0001-0000-0000-0000-000000000004',
  'TikTok Hook Opener',
  'High-attention first 3 seconds for TikTok',
  'A dramatic, attention-grabbing 3-second opener. {hook_statement} appears on screen with bold typography. Quick cut to {result_visual}. Trending TikTok aesthetic, bright and energetic.',
  'entertainment',
  true,
  0
),
(
  'tttt0001-0000-0000-0000-000000000005',
  'Before and After',
  'Transformation content',
  'A split-screen before and after video. Left side shows {before_description}. Right side reveals {after_description}. Smooth transition animation. Satisfying and impactful visual story.',
  'product_demo',
  true,
  0
)
ON CONFLICT (id) DO NOTHING;

-- Sora video post-processing jobs (SORA-008)
CREATE TABLE IF NOT EXISTS public.sora_postprocess_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_video_id UUID NOT NULL REFERENCES public.sora_video_library(id) ON DELETE CASCADE,
  operations JSONB NOT NULL, -- [{"type": "trim", "start": 0, "end": 10}, {"type": "caption", "text": "..."}, {"type": "music", "track_id": "..."}]
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  output_video_id UUID REFERENCES public.sora_video_library(id),
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sora_postprocess_user_id ON public.sora_postprocess_jobs(user_id, created_at DESC);

-- Sora multi-part stitching jobs (SORA-009)
CREATE TABLE IF NOT EXISTS public.sora_stitch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  input_segments JSONB NOT NULL, -- [{"video_id": "...", "duration": 5, "transition": "fade"}]
  background_music_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  output_video_id UUID REFERENCES public.sora_video_library(id),
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sora_stitch_user_id ON public.sora_stitch_jobs(user_id, created_at DESC);

-- RLS for Sora tables
ALTER TABLE public.sora_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sora_video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sora_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sora_postprocess_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sora_stitch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own generations" ON public.sora_generations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own video library" ON public.sora_video_library
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see public and own templates" ON public.sora_prompt_templates
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users manage own templates" ON public.sora_prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own templates" ON public.sora_prompt_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own templates" ON public.sora_prompt_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own postprocess jobs" ON public.sora_postprocess_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own stitch jobs" ON public.sora_stitch_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Update Sora Video package to set as published (SORA-003 - license integration already handled via packages table)
UPDATE public.packages
SET
  is_published = true,
  published_at = COALESCE(published_at, NOW()),
  updated_at = NOW()
WHERE slug = 'sora-video';

RAISE NOTICE 'CRM multi-tenant tables created';
RAISE NOTICE 'Sora Video generation queue, library, templates, post-processing, and stitching tables created';
