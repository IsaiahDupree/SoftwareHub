-- =============================================================================
-- SoftwareHub - Database Helper Functions
-- License key generation, access checks, download counting
-- =============================================================================

-- Generate license key in XXXX-XXXX-XXXX-XXXX format
-- Uses only non-confusing characters (no 0, O, 1, I, L)
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

-- Check if a user has valid access to a package
CREATE OR REPLACE FUNCTION has_package_access(p_user_id UUID, p_package_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.package_entitlements
    WHERE user_id = p_user_id AND package_id = p_package_id
    AND has_access = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment download count for a release
CREATE OR REPLACE FUNCTION increment_download_count(p_release_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.package_releases
  SET downloads_count = downloads_count + 1
  WHERE id = p_release_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add FK for current_release_id on packages (now that package_releases exists)
ALTER TABLE public.packages ADD CONSTRAINT fk_packages_current_release
  FOREIGN KEY (current_release_id) REFERENCES public.package_releases(id) ON DELETE SET NULL;
