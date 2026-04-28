-- Add fb_pixel_id to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS fb_pixel_id text;

-- Create campaign_visits table
CREATE TABLE IF NOT EXISTS public.campaign_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  visitor_id text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_visits_campaign_created
  ON public.campaign_visits (campaign_id, created_at DESC);

ALTER TABLE public.campaign_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visit"
  ON public.campaign_visits FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins view visits"
  ON public.campaign_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
