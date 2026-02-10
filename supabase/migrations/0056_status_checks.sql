-- =============================================================================
-- SoftwareHub - Status Checks Table
-- Health monitoring logs for packages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.status_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down', 'timeout', 'error')),
  response_time_ms INT,
  status_code INT,
  error_message TEXT,

  check_type TEXT DEFAULT 'http' CHECK (check_type IN ('http', 'tcp', 'ping', 'custom')),
  check_url TEXT,

  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_checks_package ON public.status_checks(package_id);
CREATE INDEX IF NOT EXISTS idx_status_checks_time ON public.status_checks(checked_at DESC);

-- Row Level Security
ALTER TABLE public.status_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status checks viewable" ON public.status_checks FOR SELECT USING (true);

CREATE POLICY "Admins manage status checks" ON public.status_checks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
