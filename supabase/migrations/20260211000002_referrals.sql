-- Referral system: users can share referral links, track conversions,
-- and earn credits/discounts when referred users make purchases.

-- =============================================================================
-- REFERRAL CODES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- one referral code per user
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON public.referral_codes(user_id);

-- =============================================================================
-- REFERRAL CONVERSIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email text,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  order_amount_cents int,
  reward_type text NOT NULL DEFAULT 'credit', -- 'credit', 'discount_percent', 'discount_fixed'
  reward_amount int NOT NULL DEFAULT 0,       -- cents for credit/fixed, percent for percentage
  reward_applied boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',      -- 'pending', 'qualified', 'rewarded', 'expired'
  converted_at timestamptz NOT NULL DEFAULT now(),
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referred ON public.referral_conversions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_status ON public.referral_conversions(status);

-- =============================================================================
-- REFERRAL CREDITS (balance ledger for referral rewards)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents int NOT NULL,              -- positive for credit, negative for redemption
  conversion_id uuid REFERENCES public.referral_conversions(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_user ON public.referral_credits(user_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

-- Users can view/manage their own referral code
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their conversions (as referrer)
CREATE POLICY "Users can view own referral conversions"
  ON public.referral_conversions FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can view their credit balance
CREATE POLICY "Users can view own referral credits"
  ON public.referral_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all
CREATE POLICY "Admins can manage referral codes"
  ON public.referral_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage referral conversions"
  ON public.referral_conversions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage referral credits"
  ON public.referral_credits FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can manage everything (needed for webhook processing)
CREATE POLICY "Service role manages referrals" ON public.referral_codes FOR ALL USING (true);
CREATE POLICY "Service role manages conversions" ON public.referral_conversions FOR ALL USING (true);
CREATE POLICY "Service role manages credits" ON public.referral_credits FOR ALL USING (true);

-- =============================================================================
-- FUNCTION: get_referral_balance
-- =============================================================================

CREATE OR REPLACE FUNCTION get_referral_balance(p_user_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount_cents), 0)::int
  FROM public.referral_credits
  WHERE user_id = p_user_id;
$$;

-- =============================================================================
-- FUNCTION: generate_referral_code
-- Generates a short unique referral code from user info
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  -- Generate a code based on first part of UUID + random suffix
  LOOP
    v_code := upper(
      substr(replace(p_user_id::text, '-', ''), 1, 4) ||
      substr(md5(random()::text), 1, 4)
    );

    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$;
