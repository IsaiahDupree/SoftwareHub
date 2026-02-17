-- =============================================================================
-- Publish Products Migration (AC-007, DM-010, SORA-001)
-- Marks Auto Comment and Auto DM as published in SoftwareHub
-- Adds Sora Video product listing
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Publish Auto Comment (AC-007)
--    Product is 95% complete and ready for sale
-- -----------------------------------------------------------------------
UPDATE public.packages
SET
  is_published = true,
  published_at = NOW(),
  updated_at = NOW()
WHERE slug = 'auto-comment';

-- -----------------------------------------------------------------------
-- 2. Publish Auto DM (DM-010)
--    Product is 80% complete; listing published with "Early Access" note
-- -----------------------------------------------------------------------
UPDATE public.packages
SET
  is_published = true,
  published_at = NOW(),
  updated_at = NOW(),
  tagline = 'Automated DM outreach with AI responses — Early Access'
WHERE slug = 'auto-dm';

-- -----------------------------------------------------------------------
-- 3. Publish TTS Studio (TTS-007)
--    85% complete; course content now seeded (migration 20260217300000)
-- -----------------------------------------------------------------------
UPDATE public.packages
SET
  is_published = true,
  published_at = NOW(),
  updated_at = NOW()
WHERE slug = 'tts-studio';

-- -----------------------------------------------------------------------
-- 4. Add Sora Video desktop app product listing (SORA-001)
--    70% complete — Electron app skeleton
--    Pricing: Creator $29/mo, Pro $79/mo, Studio $199/mo
-- -----------------------------------------------------------------------
INSERT INTO public.packages (
  id,
  name,
  slug,
  tagline,
  description,
  type,
  requires_macos,
  current_version,
  stripe_product_id,
  stripe_price_id,
  price_cents,
  features,
  requirements,
  is_published,
  is_featured,
  sort_order,
  published_at
) VALUES (
  'aaaa0008-0000-0000-0000-000000000008',
  'Sora Video',
  'sora-video',
  'Desktop app for AI video generation with OpenAI Sora',
  'Sora Video is a native macOS desktop application for generating AI videos with OpenAI''s Sora model. Manage projects, queue multiple generations, and preview results — all without leaving your desktop. Features a clean timeline-based interface for building video sequences from text prompts.',
  'LOCAL_AGENT',
  true,
  '0.9.0',
  'prod_sora_video', -- Replace with real Stripe product ID
  'price_sora_creator', -- Replace with real Stripe price ID
  2900, -- $29/mo creator tier
  '[
    {"name": "Text-to-video generation", "tier": "creator"},
    {"name": "Up to 5 active projects", "tier": "creator"},
    {"name": "720p output", "tier": "creator"},
    {"name": "Queue manager (5 concurrent)", "tier": "creator"},
    {"name": "1080p output", "tier": "pro"},
    {"name": "Unlimited projects", "tier": "pro"},
    {"name": "Image-to-video generation", "tier": "pro"},
    {"name": "Video extend feature", "tier": "pro"},
    {"name": "Priority generation queue", "tier": "pro"},
    {"name": "4K output (when available)", "tier": "studio"},
    {"name": "Batch generation", "tier": "studio"},
    {"name": "Commercial license", "tier": "studio"},
    {"name": "API passthrough access", "tier": "studio"},
    {"name": "Team collaboration (3 seats)", "tier": "studio"}
  ]'::jsonb,
  '{
    "os": "macOS 13.0+",
    "ram": "16GB RAM recommended",
    "storage": "10GB free space",
    "internet": "Required (Sora API)",
    "api_key": "OpenAI API key with Sora access required"
  }'::jsonb,
  false, -- Published when Electron app is complete
  false,
  55,
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  requirements = EXCLUDED.requirements,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
