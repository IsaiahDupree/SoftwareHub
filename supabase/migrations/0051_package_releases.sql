-- =============================================================================
-- SoftwareHub - Package Releases Table
-- Version history and release management for packages
-- =============================================================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_releases_package ON public.package_releases(package_id);
CREATE INDEX IF NOT EXISTS idx_releases_current ON public.package_releases(is_current) WHERE is_current = true;

-- Row Level Security
ALTER TABLE public.package_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published releases viewable" ON public.package_releases FOR SELECT
  USING (is_published = true AND NOT is_yanked);

CREATE POLICY "Admins manage releases" ON public.package_releases FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

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
