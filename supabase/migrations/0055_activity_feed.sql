-- =============================================================================
-- SoftwareHub - Activity Feed Table
-- Public and private activity log for packages and announcements
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type TEXT NOT NULL CHECK (type IN (
    'release', 'status_change', 'announcement', 'maintenance',
    'security', 'feature', 'download', 'activation', 'deactivation'
  )),

  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  release_id UUID REFERENCES public.package_releases(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  body TEXT,
  body_html TEXT,

  action_url TEXT,
  action_label TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  is_public BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_type ON public.activity_feed(type);
CREATE INDEX IF NOT EXISTS idx_activity_package ON public.activity_feed(package_id);
CREATE INDEX IF NOT EXISTS idx_activity_public ON public.activity_feed(is_public, created_at DESC);

-- Row Level Security
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public or own activities viewable" ON public.activity_feed FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Admins manage activities" ON public.activity_feed FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
