-- =============================================================================
-- Package Reviews and Ratings
-- PLT-004: Product review and rating system
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.package_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  body            TEXT,
  verified        BOOLEAN NOT NULL DEFAULT false,  -- verified purchaser
  helpful_count   INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'pending')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (package_id, user_id)  -- one review per user per package
);

-- Review helpfulness votes
CREATE TABLE IF NOT EXISTS public.package_review_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES public.package_reviews(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  helpful     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_package_reviews_package_id ON public.package_reviews(package_id);
CREATE INDEX IF NOT EXISTS idx_package_reviews_user_id    ON public.package_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_package_reviews_rating     ON public.package_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_package_reviews_status     ON public.package_reviews(status, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_package_review_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER package_review_updated_at
  BEFORE UPDATE ON public.package_reviews
  FOR EACH ROW EXECUTE FUNCTION set_package_review_updated_at();

-- Function: update helpful_count when vote changes
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.package_reviews
  SET helpful_count = (
    SELECT COUNT(*) FROM public.package_review_votes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
      AND helpful = true
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER review_helpful_count_update
  AFTER INSERT OR UPDATE OR DELETE ON public.package_review_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- RLS Policies
ALTER TABLE public.package_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_review_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read published reviews
CREATE POLICY "Anyone can read published reviews"
  ON public.package_reviews
  FOR SELECT
  USING (status = 'published');

-- Users can create one review per package (if they have entitlement)
CREATE POLICY "Verified purchasers can write reviews"
  ON public.package_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.package_entitlements pe
      WHERE pe.user_id = auth.uid()
        AND pe.package_id = package_reviews.package_id
    )
  );

-- Users can update/delete their own reviews
CREATE POLICY "Users can manage their own reviews"
  ON public.package_reviews
  FOR ALL
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON public.package_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Review votes: authenticated users can vote
CREATE POLICY "Authenticated users can vote on reviews"
  ON public.package_review_votes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- View: aggregate ratings per package
CREATE OR REPLACE VIEW public.package_rating_summary AS
  SELECT
    package_id,
    COUNT(*)                                              AS review_count,
    ROUND(AVG(rating)::NUMERIC, 1)                        AS average_rating,
    COUNT(*) FILTER (WHERE rating = 5)                    AS five_star,
    COUNT(*) FILTER (WHERE rating = 4)                    AS four_star,
    COUNT(*) FILTER (WHERE rating = 3)                    AS three_star,
    COUNT(*) FILTER (WHERE rating = 2)                    AS two_star,
    COUNT(*) FILTER (WHERE rating = 1)                    AS one_star
  FROM public.package_reviews
  WHERE status = 'published'
  GROUP BY package_id;
