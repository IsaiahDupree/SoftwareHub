-- =============================================
-- SOFTWAREHUB DATABASE SCHEMA
-- Run these migrations in order after Portal28 base
-- =============================================

-- =============================================
-- 0050_packages.sql - Software packages
-- =============================================

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

CREATE INDEX idx_packages_slug ON public.packages(slug);
CREATE INDEX idx_packages_type ON public.packages(type);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_published ON public.packages(is_published);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages viewable if published" ON public.packages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage packages" ON public.packages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- =============================================
-- 0051_package_releases.sql - Version history
-- =============================================

CREATE TABLE IF NOT EXISTS public.package_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  
  version TEXT NOT NULL,
  version_major INT,
  version_minor INT,
  version_patch INT,
  channel TEXT DEFAULT 'stable' CHECK (channel IN ('stable', 'beta', 'alpha', 'dev')),
  
  download_url TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  checksum_sha256 TEXT,
  signature TEXT,
  
  release_notes TEXT,
  release_notes_html TEXT,
  breaking_changes TEXT[],
  highlights TEXT[],
  
  min_os_version TEXT,
  supported_architectures TEXT[] DEFAULT ARRAY['arm64', 'x86_64'],
  
  is_current BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  is_yanked BOOLEAN DEFAULT false,
  
  downloads_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  UNIQUE(package_id, version)
);

CREATE INDEX idx_releases_package ON public.package_releases(package_id);
CREATE INDEX idx_releases_current ON public.package_releases(is_current) WHERE is_current = true;

ALTER TABLE public.package_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published releases viewable" ON public.package_releases FOR SELECT
  USING (is_published = true AND NOT is_yanked);

CREATE POLICY "Admins manage releases" ON public.package_releases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Version parser trigger
CREATE OR REPLACE FUNCTION parse_version_numbers() RETURNS TRIGGER AS $$
DECLARE parts TEXT[];
BEGIN
  parts := string_to_array(NEW.version, '.');
  NEW.version_major := COALESCE(parts[1]::INT, 0);
  NEW.version_minor := COALESCE(parts[2]::INT, 0);
  NEW.version_patch := COALESCE(REGEXP_REPLACE(COALESCE(parts[3], '0'), '[^0-9]', '', 'g')::INT, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_parse_version BEFORE INSERT OR UPDATE ON public.package_releases
  FOR EACH ROW EXECUTE FUNCTION parse_version_numbers();

-- =============================================
-- 0052_licenses.sql - License keys
-- =============================================

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

CREATE INDEX idx_licenses_user ON public.licenses(user_id);
CREATE INDEX idx_licenses_package ON public.licenses(package_id);
CREATE INDEX idx_licenses_key_hash ON public.licenses(license_key_hash);
CREATE INDEX idx_licenses_status ON public.licenses(status);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own licenses" ON public.licenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage licenses" ON public.licenses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- =============================================
-- 0053_device_activations.sql - Device activations
-- =============================================

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

CREATE INDEX idx_activations_license ON public.device_activations(license_id);
CREATE INDEX idx_activations_token ON public.device_activations(activation_token);
CREATE INDEX idx_activations_active ON public.device_activations(is_active) WHERE is_active = true;

ALTER TABLE public.device_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activations" ON public.device_activations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.licenses WHERE licenses.id = device_activations.license_id AND licenses.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage activations" ON public.device_activations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- =============================================
-- 0054_package_entitlements.sql - Access grants
-- =============================================

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

CREATE INDEX idx_entitlements_user ON public.package_entitlements(user_id);
CREATE INDEX idx_entitlements_package ON public.package_entitlements(package_id);
CREATE INDEX idx_entitlements_access ON public.package_entitlements(has_access) WHERE has_access = true;

ALTER TABLE public.package_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own entitlements" ON public.package_entitlements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage entitlements" ON public.package_entitlements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- =============================================
-- 0055_activity_feed.sql - Activity feed
-- =============================================

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

CREATE INDEX idx_activity_type ON public.activity_feed(type);
CREATE INDEX idx_activity_package ON public.activity_feed(package_id);
CREATE INDEX idx_activity_public ON public.activity_feed(is_public, created_at DESC);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public or own activities viewable" ON public.activity_feed FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Admins manage activities" ON public.activity_feed FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- =============================================
-- 0056_status_checks.sql - Status check logs
-- =============================================

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

CREATE INDEX idx_status_checks_package ON public.status_checks(package_id);
CREATE INDEX idx_status_checks_time ON public.status_checks(checked_at DESC);

ALTER TABLE public.status_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status checks viewable" ON public.status_checks FOR SELECT USING (true);

-- =============================================
-- 0057_download_logs.sql - Download tracking
-- =============================================

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

CREATE INDEX idx_downloads_package ON public.download_logs(package_id);
CREATE INDEX idx_downloads_user ON public.download_logs(user_id);
CREATE INDEX idx_downloads_time ON public.download_logs(started_at DESC);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own downloads" ON public.download_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all downloads" ON public.download_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- =============================================
-- 0058_functions.sql - Helper functions
-- =============================================

CREATE OR REPLACE FUNCTION generate_license_key() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i IN (4, 8, 12) THEN result := result || '-'; END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_package_access(p_user_id UUID, p_package_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.package_entitlements
    WHERE user_id = p_user_id AND package_id = p_package_id
    AND has_access = true AND (expires_at IS NULL OR expires_at > NOW()) AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_download_count(p_release_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.package_releases SET downloads_count = downloads_count + 1 WHERE id = p_release_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add FK for current_release_id
ALTER TABLE public.packages ADD CONSTRAINT fk_packages_current_release
  FOREIGN KEY (current_release_id) REFERENCES public.package_releases(id) ON DELETE SET NULL;
