-- =============================================================================
-- SoftwareHub - Download Logs Table
-- Download tracking and analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  release_id UUID REFERENCES public.package_releases(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,

  download_url TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,

  ip_address INET,
  user_agent TEXT,
  country_code TEXT,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  bytes_downloaded BIGINT,
  is_complete BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_downloads_package ON public.download_logs(package_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON public.download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_time ON public.download_logs(started_at DESC);

-- Row Level Security
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own downloads" ON public.download_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all downloads" ON public.download_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins insert downloads" ON public.download_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
