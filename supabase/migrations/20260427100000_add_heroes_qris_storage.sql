-- =====================
-- TABLE: heroes (banner carousel)
-- =====================
CREATE TABLE public.heroes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  gambar_url TEXT NOT NULL,
  link_url TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active heroes"
  ON public.heroes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage heroes"
  ON public.heroes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for heroes
INSERT INTO storage.buckets (id, name, public) VALUES ('heroes', 'heroes', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read hero images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'heroes');

CREATE POLICY "Admins manage hero images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'heroes' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'heroes' AND public.has_role(auth.uid(), 'admin'));

-- =====================
-- TABLE: qris_list
-- =====================
CREATE TABLE public.qris_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  deskripsi TEXT,
  gambar_url TEXT NOT NULL,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qris_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active qris"
  ON public.qris_list FOR SELECT
  USING (true);

CREATE POLICY "Admins manage qris"
  ON public.qris_list FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for qris images
INSERT INTO storage.buckets (id, name, public) VALUES ('qris', 'qris', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read qris images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qris');

CREATE POLICY "Admins manage qris images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'qris' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'qris' AND public.has_role(auth.uid(), 'admin'));

-- =====================
-- UPDATE: campaigns add qris_id FK
-- =====================
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS qris_id UUID REFERENCES public.qris_list(id) ON DELETE SET NULL;

-- =====================
-- UPDATE: campaigns.terkumpul real-time from verified donations
-- =====================
CREATE OR REPLACE FUNCTION public.sync_campaign_terkumpul(p_campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET terkumpul = COALESCE((
    SELECT SUM(nominal)
    FROM public.donations
    WHERE campaign_id = p_campaign_id AND status = 'verified'
  ), 0),
  updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

-- Drop old trigger and replace with new one
DROP TRIGGER IF EXISTS donations_verify_trigger ON public.donations;

CREATE OR REPLACE FUNCTION public.update_campaign_terkumpul()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On verify: recalculate total
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') AND NEW.campaign_id IS NOT NULL THEN
    NEW.verified_at = now();
    PERFORM public.sync_campaign_terkumpul(NEW.campaign_id);
  END IF;
  -- On unverify (revert): recalculate
  IF OLD.status = 'verified' AND NEW.status != 'verified' AND NEW.campaign_id IS NOT NULL THEN
    NEW.verified_at = NULL;
    PERFORM public.sync_campaign_terkumpul(NEW.campaign_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER donations_verify_trigger
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_terkumpul();

-- Allow admin to delete donations
CREATE POLICY "Admins delete donations"
  ON public.donations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete bukti-transfer storage objects
CREATE POLICY "Admins delete bukti"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'bukti-transfer' AND public.has_role(auth.uid(), 'admin'));

-- Seed initial hero data
INSERT INTO public.heroes (judul, gambar_url, link_url, urutan, aktif) VALUES
  ('Sedekah Jumat Pahala Berlipat', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800', '/campaign', 1, true),
  ('Bantu Saudara Kita di Palestina', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', '/campaign', 2, true);
