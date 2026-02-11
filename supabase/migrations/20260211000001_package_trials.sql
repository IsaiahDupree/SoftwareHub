-- Package Trials: track trial usage to enforce one trial per user per package.

CREATE TABLE IF NOT EXISTS public.package_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  license_id uuid REFERENCES public.licenses(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  converted_at timestamptz,       -- set when trial converts to paid
  converted_license_id uuid REFERENCES public.licenses(id) ON DELETE SET NULL,
  UNIQUE(user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_package_trials_user ON public.package_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_package_trials_expires ON public.package_trials(expires_at);

-- RLS
ALTER TABLE public.package_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trials"
  ON public.package_trials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage trials"
  ON public.package_trials FOR ALL
  USING (true);

-- Add trial_days column to packages to allow per-package trial duration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'packages' AND column_name = 'trial_days') THEN
    ALTER TABLE public.packages ADD COLUMN trial_days int DEFAULT 7;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'packages' AND column_name = 'trial_enabled') THEN
    ALTER TABLE public.packages ADD COLUMN trial_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;
