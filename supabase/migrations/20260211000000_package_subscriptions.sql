-- Package Subscriptions: adds "all-access" subscription tier that grants
-- entitlements to every published package while the subscription is active.

-- =============================================================================
-- ADD includes_all_packages flag to membership_plans
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'membership_plans' AND column_name = 'includes_all_packages') THEN
    ALTER TABLE public.membership_plans
      ADD COLUMN includes_all_packages boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- =============================================================================
-- PACKAGE SUBSCRIPTION TIERS table
-- Allows defining standalone package subscription products that aren't
-- necessarily tied to the membership_plans system.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.package_subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  badge text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_cents_monthly int NOT NULL DEFAULT 0,
  price_cents_yearly int,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  stripe_product_id text,
  includes_all_packages boolean NOT NULL DEFAULT true,
  -- If not all packages, specify which ones:
  included_package_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_devices_per_license int NOT NULL DEFAULT 3,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pkg_sub_tiers_slug ON public.package_subscription_tiers(slug);
CREATE INDEX IF NOT EXISTS idx_pkg_sub_tiers_published ON public.package_subscription_tiers(is_published);

-- =============================================================================
-- ADD package_subscription_tier_id to subscriptions
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'subscriptions' AND column_name = 'package_subscription_tier_id') THEN
    ALTER TABLE public.subscriptions
      ADD COLUMN package_subscription_tier_id uuid REFERENCES public.package_subscription_tiers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.package_subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published package subscription tiers"
  ON public.package_subscription_tiers FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage package subscription tiers"
  ON public.package_subscription_tiers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- FUNCTION: grant_all_package_entitlements
-- Grants entitlements for all published packages to a user.
-- Called when a subscription with includes_all_packages=true becomes active.
-- =============================================================================

CREATE OR REPLACE FUNCTION grant_all_package_entitlements(
  p_user_id uuid,
  p_source text DEFAULT 'subscription',
  p_source_id text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int := 0;
BEGIN
  INSERT INTO public.package_entitlements (user_id, package_id, has_access, access_level, source, source_id, granted_at, expires_at)
  SELECT
    p_user_id,
    p.id,
    true,
    'full',
    p_source,
    p_source_id,
    now(),
    p_expires_at
  FROM public.packages p
  WHERE p.is_published = true
  ON CONFLICT (user_id, package_id) DO UPDATE SET
    has_access = true,
    access_level = 'full',
    source = p_source,
    source_id = COALESCE(p_source_id, package_entitlements.source_id),
    expires_at = p_expires_at,
    revoked_at = NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================================================
-- FUNCTION: revoke_subscription_package_entitlements
-- Revokes package entitlements that were granted via subscription.
-- Called when a subscription is canceled or expired.
-- =============================================================================

CREATE OR REPLACE FUNCTION revoke_subscription_package_entitlements(
  p_user_id uuid,
  p_source_id text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int := 0;
BEGIN
  UPDATE public.package_entitlements
  SET has_access = false,
      revoked_at = now()
  WHERE user_id = p_user_id
    AND source = 'subscription'
    AND (p_source_id IS NULL OR source_id = p_source_id)
    AND has_access = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================================================
-- TRIGGER: auto-update updated_at
-- =============================================================================

CREATE TRIGGER package_subscription_tiers_updated_at
  BEFORE UPDATE ON public.package_subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
