-- =============================================================================
-- SoftwareHub - Licenses Table
-- License key management for software packages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,

  license_key TEXT UNIQUE NOT NULL,
  license_key_hash TEXT NOT NULL,

  license_type TEXT DEFAULT 'standard' CHECK (license_type IN ('standard', 'pro', 'enterprise', 'trial')),
  max_devices INT DEFAULT 2,
  active_devices INT DEFAULT 0,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
  suspension_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  source TEXT DEFAULT 'purchase' CHECK (source IN ('purchase', 'subscription', 'gift', 'promo', 'admin', 'trial')),
  source_id TEXT,

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  UNIQUE(user_id, package_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licenses_user ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_package ON public.licenses(package_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key_hash ON public.licenses(license_key_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);

-- Row Level Security
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own licenses" ON public.licenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage licenses" ON public.licenses FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
