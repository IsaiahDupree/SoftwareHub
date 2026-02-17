-- =============================================================================
-- SoftwareHub - Product Listings Migration
-- Seeds initial product records for the SoftwareHub Products Suite
-- Products: Watermark Remover (BlankLogo), EverReach CRM, Auto Comment,
--           TTS Studio, Auto DM, KaloData Scraper, Competitor Research
-- =============================================================================

-- Note: Stripe product/price IDs are placeholders.
-- Run `npm run stripe:create-products` or create via Stripe Dashboard
-- and update stripe_product_id / stripe_price_id fields.

-- -----------------------------------------------------------------------
-- 1. Watermark Remover (BlankLogo) - 100% Complete, LOCAL_AGENT
-- Pricing: Personal $49, Pro $99, Team $249 (one-time)
-- -----------------------------------------------------------------------
INSERT INTO public.packages (
  id,
  name,
  slug,
  tagline,
  description,
  type,
  requires_macos,
  min_os_version,
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
  'aaaa0001-0000-0000-0000-000000000001',
  'Watermark Remover',
  'watermark-remover',
  'Remove watermarks from images and videos in seconds',
  'BlankLogo is a powerful AI-powered watermark remover for images and videos. Clean any logo, text overlay, or watermark with precision. Supports batch processing for entire folders and runs locally on your machine for privacy.',
  'LOCAL_AGENT',
  true,
  '12.0',
  '1.0.0',
  'prod_watermark_remover', -- Replace with real Stripe product ID
  'price_watermark_personal', -- Replace with real Stripe price ID (Personal tier)
  4900, -- $49 personal tier
  '[
    {"name": "AI-powered watermark detection", "tier": "personal"},
    {"name": "Image processing (PNG, JPG, WEBP)", "tier": "personal"},
    {"name": "Video processing (MP4, MOV)", "tier": "personal"},
    {"name": "Batch folder processing", "tier": "pro"},
    {"name": "Priority processing queue", "tier": "pro"},
    {"name": "Team license (5 seats)", "tier": "team"},
    {"name": "Commercial use license", "tier": "team"},
    {"name": "API access", "tier": "team"}
  ]'::jsonb,
  '{
    "os": "macOS 12.0+",
    "ram": "8GB RAM",
    "storage": "2GB free space",
    "gpu": "Metal-compatible GPU (optional, for acceleration)"
  }'::jsonb,
  true,
  true,
  10,
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  requirements = EXCLUDED.requirements,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 2. EverReach CRM - 100% Complete, CLOUD_APP
-- Pricing: Starter $29/mo, Pro $79/mo
-- -----------------------------------------------------------------------
INSERT INTO public.packages (
  id,
  name,
  slug,
  tagline,
  description,
  type,
  requires_macos,
  web_app_url,
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
  'aaaa0002-0000-0000-0000-000000000002',
  'EverReach CRM',
  'everreach-crm',
  'Stay warm with every contact in your network',
  'EverReach CRM is a relationship-focused contact management system built for coaches, consultants, and solopreneurs. Track warmth scores, schedule follow-ups, and never let a valuable relationship go cold. Multi-tenant SaaS with full data isolation.',
  'CLOUD_APP',
  false,
  'https://crm.everreach.app', -- Update with real deployment URL
  '2.0.0',
  'prod_everreach_crm', -- Replace with real Stripe product ID
  'price_everreach_starter', -- Replace with real Stripe price ID (Starter tier)
  2900, -- $29/mo starter tier
  '[
    {"name": "Up to 500 contacts", "tier": "starter"},
    {"name": "Warmth score tracking", "tier": "starter"},
    {"name": "Follow-up reminders", "tier": "starter"},
    {"name": "Contact notes & history", "tier": "starter"},
    {"name": "Unlimited contacts", "tier": "pro"},
    {"name": "Advanced analytics", "tier": "pro"},
    {"name": "CSV & vCard import", "tier": "pro"},
    {"name": "Calendar integration", "tier": "pro"},
    {"name": "API access", "tier": "pro"},
    {"name": "Team collaboration (3 seats)", "tier": "pro"}
  ]'::jsonb,
  '{
    "browser": "Any modern browser",
    "internet": "Required (cloud app)"
  }'::jsonb,
  true,
  true,
  20,
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  web_app_url = EXCLUDED.web_app_url,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 3. Auto Comment - 95% Complete, LOCAL_AGENT
-- Pricing: Starter $29/mo, Pro $49/mo, Agency $149/mo
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
  'aaaa0003-0000-0000-0000-000000000003',
  'Auto Comment',
  'auto-comment',
  'AI-powered comment automation for Instagram, TikTok, Twitter & Threads',
  'Auto Comment is a multi-platform comment automation tool that uses AI to post relevant, engaging comments on Instagram, TikTok, Twitter/X, and Threads. Configure targeting rules, tone presets, and posting schedules to grow your audience on autopilot.',
  'LOCAL_AGENT',
  true,
  '1.0.0',
  'prod_auto_comment', -- Replace with real Stripe product ID
  'price_auto_comment_starter', -- Replace with real Stripe price ID
  2900, -- $29/mo starter tier
  '[
    {"name": "Instagram automation", "tier": "starter"},
    {"name": "TikTok automation", "tier": "starter"},
    {"name": "AI comment generation", "tier": "starter"},
    {"name": "Up to 50 comments/day", "tier": "starter"},
    {"name": "Twitter/X automation", "tier": "pro"},
    {"name": "Threads automation", "tier": "pro"},
    {"name": "Up to 200 comments/day", "tier": "pro"},
    {"name": "Comment template library", "tier": "pro"},
    {"name": "Analytics dashboard", "tier": "pro"},
    {"name": "Unlimited comments", "tier": "agency"},
    {"name": "Multi-account management", "tier": "agency"},
    {"name": "White-label reporting", "tier": "agency"}
  ]'::jsonb,
  '{
    "os": "macOS 12.0+",
    "ram": "4GB RAM",
    "storage": "500MB free space",
    "browser": "Safari (for platform automation)"
  }'::jsonb,
  false, -- Not published until fully complete
  false,
  30,
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 4. Auto DM - 80% Complete, LOCAL_AGENT
-- Pricing: Starter $49/mo, Pro $99/mo, Agency $249/mo
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
  'aaaa0004-0000-0000-0000-000000000004',
  'Auto DM',
  'auto-dm',
  'Automated DM outreach with AI responses across all major platforms',
  'Auto DM is a multi-platform direct message automation tool with AI-powered conversation handling. Send personalized DMs, manage lead nurture sequences, and let AI respond contextually. Supports Instagram, TikTok, Twitter/X, and more.',
  'LOCAL_AGENT',
  true,
  '1.0.0',
  'prod_auto_dm', -- Replace with real Stripe product ID
  'price_auto_dm_starter', -- Replace with real Stripe price ID
  4900, -- $49/mo starter tier
  '[
    {"name": "Instagram DM automation", "tier": "starter"},
    {"name": "AI response generation", "tier": "starter"},
    {"name": "Up to 30 DMs/day", "tier": "starter"},
    {"name": "Basic lead tracking", "tier": "starter"},
    {"name": "TikTok & Twitter DMs", "tier": "pro"},
    {"name": "Up to 75 DMs/day", "tier": "pro"},
    {"name": "Conversation threading", "tier": "pro"},
    {"name": "Scheduled nurture sequences", "tier": "pro"},
    {"name": "Lead scoring", "tier": "pro"},
    {"name": "Unlimited DMs", "tier": "agency"},
    {"name": "Multi-account management", "tier": "agency"},
    {"name": "CRM sync", "tier": "agency"},
    {"name": "Image/media handling", "tier": "agency"}
  ]'::jsonb,
  '{
    "os": "macOS 12.0+",
    "ram": "4GB RAM",
    "storage": "500MB free space",
    "browser": "Safari (for platform automation)"
  }'::jsonb,
  false, -- Not published until fully complete
  false,
  40,
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 5. TTS Studio - 85% Complete, LOCAL_AGENT
-- Pricing: Starter $29/mo, Pro $79/mo, Studio $199/mo, Lifetime $499
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
  'aaaa0005-0000-0000-0000-000000000005',
  'TTS Studio',
  'tts-studio',
  'Professional text-to-speech with AI voice cloning',
  'TTS Studio is a professional desktop text-to-speech application with AI voice cloning. Record a 30-second sample to clone any voice, then generate unlimited audio from scripts. Export to MP3, AAC, or WAV. Runs 100% locally for privacy.',
  'LOCAL_AGENT',
  true,
  '1.0.0',
  'prod_tts_studio', -- Replace with real Stripe product ID
  'price_tts_starter', -- Replace with real Stripe price ID
  2900, -- $29/mo starter tier
  '[
    {"name": "50+ built-in voices", "tier": "starter"},
    {"name": "MP3 export", "tier": "starter"},
    {"name": "Up to 10,000 chars/month", "tier": "starter"},
    {"name": "Voice cloning (1 voice)", "tier": "pro"},
    {"name": "SSML support", "tier": "pro"},
    {"name": "Unlimited characters", "tier": "pro"},
    {"name": "Batch generation", "tier": "pro"},
    {"name": "AAC & WAV export", "tier": "pro"},
    {"name": "Unlimited voice clones", "tier": "studio"},
    {"name": "Priority processing", "tier": "studio"},
    {"name": "Commercial license", "tier": "studio"},
    {"name": "API access", "tier": "studio"},
    {"name": "Lifetime access - all Studio features", "tier": "lifetime"}
  ]'::jsonb,
  '{
    "os": "macOS 12.0+",
    "ram": "8GB RAM recommended",
    "storage": "5GB free space (models)",
    "gpu": "Apple Silicon preferred"
  }'::jsonb,
  false, -- Not published until fully complete
  false,
  50,
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 6. KaloData Scraper - 0% (New), LOCAL_AGENT / CLOUD_APP TBD
-- Pricing: Starter $49/mo, Pro $99/mo, Enterprise $249/mo
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
  'aaaa0006-0000-0000-0000-000000000006',
  'KaloData Scraper',
  'kalodata-scraper',
  'TikTok Shop product research and analytics at scale',
  'KaloData Scraper is a powerful TikTok Shop research tool that extracts product performance data, sales estimates, revenue trends, and competitor intelligence from KaloData.com. Discover trending products before the market catches on.',
  'LOCAL_AGENT',
  true,
  NULL, -- Not released yet
  'prod_kalodata_scraper', -- Replace with real Stripe product ID
  'price_kalodata_starter', -- Replace with real Stripe price ID
  4900, -- $49/mo starter tier
  '[
    {"name": "Product metrics scraping", "tier": "starter"},
    {"name": "Up to 100 products/day", "tier": "starter"},
    {"name": "CSV export", "tier": "starter"},
    {"name": "Trending product discovery", "tier": "pro"},
    {"name": "Historical data tracking", "tier": "pro"},
    {"name": "Up to 1,000 products/day", "tier": "pro"},
    {"name": "Data visualization dashboard", "tier": "pro"},
    {"name": "Scheduled scraping", "tier": "enterprise"},
    {"name": "Unlimited scraping", "tier": "enterprise"},
    {"name": "API access", "tier": "enterprise"},
    {"name": "Supabase data storage", "tier": "enterprise"}
  ]'::jsonb,
  '{
    "os": "macOS 12.0+",
    "ram": "4GB RAM",
    "storage": "1GB free space",
    "browser": "Chrome (for scraping)"
  }'::jsonb,
  false, -- Not published - not built yet
  false,
  60,
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 7. Competitor Research Tool - 0% (New), LOCAL_AGENT
-- Pricing: Starter $39/mo, Pro $79/mo, Agency $199/mo
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
  'aaaa0007-0000-0000-0000-000000000007',
  'Competitor Research',
  'competitor-research',
  'Multi-platform competitor monitoring and intelligence',
  'Competitor Research is an automated multi-platform competitor intelligence tool. Track your competitors across Instagram, TikTok, Twitter, and YouTube. Monitor posting patterns, engagement trends, viral content, and pricing changes. Get weekly digest reports delivered automatically.',
  'LOCAL_AGENT',
  true,
  NULL, -- Not released yet
  'prod_competitor_research', -- Replace with real Stripe product ID
  'price_competitor_starter', -- Replace with real Stripe price ID
  3900, -- $39/mo starter tier
  '[
    {"name": "Track up to 5 profiles", "tier": "starter"},
    {"name": "Instagram & TikTok monitoring", "tier": "starter"},
    {"name": "Weekly digest email", "tier": "starter"},
    {"name": "Track up to 20 profiles", "tier": "pro"},
    {"name": "All platform monitoring", "tier": "pro"},
    {"name": "Content performance analysis", "tier": "pro"},
    {"name": "Posting pattern detection", "tier": "pro"},
    {"name": "Hashtag monitoring", "tier": "pro"},
    {"name": "Unlimited profiles", "tier": "agency"},
    {"name": "Competitor pricing alerts", "tier": "agency"},
    {"name": "White-label PDF reports", "tier": "agency"},
    {"name": "Slack integration", "tier": "agency"},
    {"name": "API access", "tier": "agency"}
  ]'::jsonb,
  '{
    "os": "macOS 12.0+",
    "ram": "4GB RAM",
    "storage": "1GB free space"
  }'::jsonb,
  false, -- Not published - not built yet
  false,
  70,
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- Verification: Show inserted packages
-- -----------------------------------------------------------------------
-- SELECT id, name, slug, type, is_published, price_cents FROM public.packages
-- WHERE slug IN (
--   'watermark-remover', 'everreach-crm', 'auto-comment',
--   'auto-dm', 'tts-studio', 'kalodata-scraper', 'competitor-research'
-- )
-- ORDER BY sort_order;
