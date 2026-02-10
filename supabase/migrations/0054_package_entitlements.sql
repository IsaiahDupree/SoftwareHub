-- =============================================================================
-- SoftwareHub - Package Entitlements Table
-- Access grants for users to packages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.package_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,

  has_access BOOLEAN DEFAULT true,
  access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'limited', 'trial', 'preview')),

  source TEXT NOT NULL CHECK (source IN ('purchase', 'subscription', 'gift', 'promo', 'admin', 'bundle', 'course')),
  source_id TEXT,
  source_package_id UUID,

  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  UNIQUE(user_id, package_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON public.package_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_package ON public.package_entitlements(package_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_access ON public.package_entitlements(has_access) WHERE has_access = true;

-- Row Level Security
ALTER TABLE public.package_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own entitlements" ON public.package_entitlements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage entitlements" ON public.package_entitlements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
