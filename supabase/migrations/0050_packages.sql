-- =============================================================================
-- SoftwareHub - Packages Table
-- Core table for software packages (local agents and cloud apps)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,

  type TEXT NOT NULL CHECK (type IN ('LOCAL_AGENT', 'CLOUD_APP')),
  requires_macos BOOLEAN DEFAULT false,
  min_os_version TEXT,

  download_url TEXT,
  web_app_url TEXT,

  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
  status_message TEXT,
  last_status_check TIMESTAMPTZ,
  status_check_url TEXT,

  current_version TEXT,
  current_release_id UUID,

  stripe_product_id TEXT,
  stripe_price_id TEXT,
  price_cents INT,

  icon_url TEXT,
  banner_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '{}'::jsonb,

  related_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  documentation_url TEXT,
  support_url TEXT,

  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_packages_slug ON public.packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_type ON public.packages(type);
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_published ON public.packages(is_published);

-- Row Level Security
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages viewable if published" ON public.packages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage packages" ON public.packages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
