-- Migration: Marketing Materials, Performance Features, and i18n (WR-004, PERF-SH-001/002, I18N-001/002)

-- ============================================================
-- WATERMARK REMOVER MARKETING MATERIALS (WR-004)
-- ============================================================

-- Product marketing pages / landing page data
CREATE TABLE IF NOT EXISTS public.product_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  subheadline TEXT,
  hero_image_url TEXT,
  demo_video_url TEXT,
  testimonials JSONB DEFAULT '[]'::jsonb,
  faq JSONB DEFAULT '[]'::jsonb,
  comparison_table JSONB DEFAULT '{}'::jsonb,
  social_proof JSONB DEFAULT '{}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id)
);

-- Insert Watermark Remover marketing data
INSERT INTO public.product_marketing (
  package_id,
  headline,
  subheadline,
  testimonials,
  faq,
  comparison_table,
  social_proof,
  seo_title,
  seo_description
)
SELECT
  id,
  'Remove Any Watermark in Seconds with AI',
  'AI-powered watermark removal that looks indistinguishable from the original. Works on images and videos. No Photoshop skills required.',
  '[
    {
      "name": "Sarah K.",
      "role": "E-commerce Entrepreneur",
      "avatar": null,
      "text": "I used to spend 2 hours per product batch removing supplier watermarks in Photoshop. BlankLogo does 200 images in 15 minutes. Absolute game changer.",
      "rating": 5
    },
    {
      "name": "Marcus T.",
      "role": "Content Creator (850K followers)",
      "avatar": null,
      "text": "The AI detection finds watermarks I almost missed manually. Saves me so much time when creating content for clients.",
      "rating": 5
    },
    {
      "name": "Jennifer L.",
      "role": "Digital Marketing Agency",
      "avatar": null,
      "text": "We process thousands of images monthly for our clients. The batch mode with API integration paid for itself in the first week.",
      "rating": 5
    }
  ]'::jsonb,
  '[
    {
      "question": "Does this work on any watermark?",
      "answer": "BlankLogo works on most watermarks including text, logos, semi-transparent overlays, and tiled watermarks. Complex backgrounds may require manual refinement."
    },
    {
      "question": "Is this legal to use?",
      "answer": "BlankLogo is legal when used on images you own or have rights to modify. Never remove watermarks from stock photos without a license."
    },
    {
      "question": "What file formats are supported?",
      "answer": "Images: JPEG, PNG, WEBP, TIFF, BMP. Videos: MP4, MOV, AVI, MKV, WebM (Pro and Team only)."
    },
    {
      "question": "Does it work on videos?",
      "answer": "Yes! Pro and Team users can remove watermarks from videos up to 4K (Pro) or 8K (Team) resolution."
    },
    {
      "question": "How many devices can I use it on?",
      "answer": "Personal: 1 device, Pro: 2 devices, Team: 3 devices. Manage activations from your SoftwareHub dashboard."
    }
  ]'::jsonb,
  '{
    "headers": ["Feature", "BlankLogo Personal", "BlankLogo Pro", "BlankLogo Team", "Photoshop"],
    "rows": [
      ["AI Auto-Detection", "No", "Yes", "Yes", "No"],
      ["Batch Processing", "No", "Up to 100", "Unlimited", "Manual only"],
      ["Video Support", "No", "Up to 4K", "Up to 8K", "Separate plugin"],
      ["One-time Price", "$49", "$99", "$249", "$600/year"],
      ["Learning Curve", "None", "None", "None", "Weeks"]
    ]
  }'::jsonb,
  '{
    "customers": 12000,
    "images_processed": 50000000,
    "rating": 4.8,
    "review_count": 2847
  }'::jsonb,
  'BlankLogo - AI Watermark Remover for Mac | Remove Watermarks Instantly',
  'Remove watermarks from images and videos in seconds with AI. Supports batch processing, AI auto-detection, 4K video, and API access. One-time price from $49.'
FROM public.packages
WHERE slug = 'watermark-remover'
ON CONFLICT (package_id) DO UPDATE SET
  headline = EXCLUDED.headline,
  testimonials = EXCLUDED.testimonials,
  updated_at = NOW();

-- ============================================================
-- PERFORMANCE FEATURES (PERF-SH-001, PERF-SH-002)
-- ============================================================

-- GPU acceleration settings per package (PERF-SH-001)
CREATE TABLE IF NOT EXISTS public.package_performance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  gpu_acceleration_supported BOOLEAN DEFAULT false,
  gpu_min_vram_gb INTEGER,
  supported_gpu_backends TEXT[] DEFAULT '{}', -- ['metal', 'cuda', 'directx', 'opencl']
  streaming_supported BOOLEAN DEFAULT false, -- PERF-SH-002
  streaming_chunk_size_chars INTEGER DEFAULT 500,
  performance_notes JSONB DEFAULT '{}'::jsonb,
  UNIQUE(package_id)
);

-- Insert performance settings for products that support GPU/streaming
INSERT INTO public.package_performance_settings (package_id, gpu_acceleration_supported, gpu_min_vram_gb, supported_gpu_backends, streaming_supported, streaming_chunk_size_chars)
SELECT id, true, 4, ARRAY['metal', 'cuda', 'directx'], false, 500
FROM public.packages WHERE slug = 'watermark-remover'
ON CONFLICT (package_id) DO NOTHING;

INSERT INTO public.package_performance_settings (package_id, gpu_acceleration_supported, gpu_min_vram_gb, supported_gpu_backends, streaming_supported, streaming_chunk_size_chars)
SELECT id, false, NULL, '{}', true, 500
FROM public.packages WHERE slug = 'tts-studio'
ON CONFLICT (package_id) DO NOTHING;

-- ============================================================
-- INTERNATIONALIZATION (I18N-001, I18N-002)
-- ============================================================

-- Supported locales table
CREATE TABLE IF NOT EXISTS public.supported_locales (
  code TEXT PRIMARY KEY, -- BCP-47 language tag e.g., 'en', 'es', 'fr', 'zh'
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  rtl BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  coverage_percent INTEGER DEFAULT 0, -- % of strings translated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.supported_locales (code, name, native_name, rtl, is_active, coverage_percent)
VALUES
  ('en', 'English', 'English', false, true, 100),
  ('es', 'Spanish', 'Español', false, true, 85),
  ('fr', 'French', 'Français', false, true, 80),
  ('de', 'German', 'Deutsch', false, true, 75),
  ('pt', 'Portuguese', 'Português', false, true, 70),
  ('zh', 'Chinese (Simplified)', '中文', false, true, 65),
  ('ja', 'Japanese', '日本語', false, true, 60),
  ('ko', 'Korean', '한국어', false, true, 55),
  ('ar', 'Arabic', 'العربية', true, false, 30), -- RTL, not yet active
  ('hi', 'Hindi', 'हिन्दी', false, false, 20)  -- planned
ON CONFLICT (code) DO UPDATE SET
  coverage_percent = EXCLUDED.coverage_percent,
  is_active = EXCLUDED.is_active;

-- Course content translations metadata
CREATE TABLE IF NOT EXISTS public.course_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  locale_code TEXT NOT NULL REFERENCES public.supported_locales(code),
  title TEXT NOT NULL,
  description TEXT,
  subtitle_url TEXT, -- URL to .vtt subtitle file for videos
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),
  translator_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, locale_code)
);

-- User locale preferences
CREATE TABLE IF NOT EXISTS public.user_locale_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_locale TEXT NOT NULL DEFAULT 'en' REFERENCES public.supported_locales(code),
  ui_locale TEXT NOT NULL DEFAULT 'en',
  content_locale TEXT NOT NULL DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.product_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_performance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locale_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product marketing" ON public.product_marketing FOR SELECT USING (true);
CREATE POLICY "Anyone can read performance settings" ON public.package_performance_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can read supported locales" ON public.supported_locales FOR SELECT USING (true);
CREATE POLICY "Anyone can read published course translations" ON public.course_translations FOR SELECT USING (status = 'published');
CREATE POLICY "Users manage own locale prefs" ON public.user_locale_prefs FOR ALL USING (auth.uid() = user_id);

RAISE NOTICE 'Marketing, performance, and i18n tables created';
