ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS urutan integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_campaigns_order ON public.campaigns (is_pinned DESC, urutan ASC);