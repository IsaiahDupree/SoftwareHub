-- =============================================================================
-- License Fraud Alerts Table
-- LIC-006: License usage analytics and fraud detection
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.license_fraud_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id    UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_type    TEXT NOT NULL,       -- 'ip_abuse', 'rapid_activations', 'key_sharing', 'hammering'
  risk_score    INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  details       JSONB NOT NULL DEFAULT '{}',
  ip_address    TEXT,
  resolved      BOOLEAN NOT NULL DEFAULT false,
  resolved_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_license_id   ON public.license_fraud_alerts(license_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_unresolved   ON public.license_fraud_alerts(resolved, risk_score DESC)
  WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created_at   ON public.license_fraud_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_ip_address   ON public.license_fraud_alerts(ip_address)
  WHERE ip_address IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_fraud_alert_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER fraud_alert_updated_at
  BEFORE UPDATE ON public.license_fraud_alerts
  FOR EACH ROW EXECUTE FUNCTION set_fraud_alert_updated_at();

-- RLS: Only admins can view/manage fraud alerts
ALTER TABLE public.license_fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fraud alerts"
  ON public.license_fraud_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
