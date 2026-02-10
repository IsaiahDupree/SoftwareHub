-- =============================================================================
-- SoftwareHub - Device Activations Table
-- Tracks device registrations and activation tokens for licenses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,

  device_id TEXT NOT NULL,
  device_id_hash TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,

  os_name TEXT,
  os_version TEXT,
  app_version TEXT,
  hardware_model TEXT,

  activation_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip_address INET,

  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,

  UNIQUE(license_id, device_id_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activations_license ON public.device_activations(license_id);
CREATE INDEX IF NOT EXISTS idx_activations_token ON public.device_activations(activation_token);
CREATE INDEX IF NOT EXISTS idx_activations_active ON public.device_activations(is_active) WHERE is_active = true;

-- Row Level Security
ALTER TABLE public.device_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activations" ON public.device_activations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.licenses
    WHERE licenses.id = device_activations.license_id
    AND licenses.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage activations" ON public.device_activations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
