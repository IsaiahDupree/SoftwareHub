-- Add software-specific notification preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS email_on_new_release boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_on_status_change boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_on_license_expiration boolean NOT NULL DEFAULT true;
