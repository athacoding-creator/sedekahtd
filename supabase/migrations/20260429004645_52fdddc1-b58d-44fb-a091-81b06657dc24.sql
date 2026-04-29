-- 1. Tabel payment_methods
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL DEFAULT 'qris',
  nomor_rekening TEXT,
  nama_pemilik TEXT,
  gambar_url TEXT,
  deskripsi TEXT,
  aktif BOOLEAN NOT NULL DEFAULT true,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (true);

CREATE POLICY "Admins manage payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Tabel jembatan campaign_payment_methods
CREATE TABLE public.campaign_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, payment_method_id)
);

CREATE INDEX idx_cpm_campaign ON public.campaign_payment_methods(campaign_id);
CREATE INDEX idx_cpm_payment ON public.campaign_payment_methods(payment_method_id);

ALTER TABLE public.campaign_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign payment links"
  ON public.campaign_payment_methods FOR SELECT
  USING (true);

CREATE POLICY "Admins manage campaign payment links"
  ON public.campaign_payment_methods FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Migrasi data dari qris_list -> payment_methods (pakai id yang sama agar relasi mudah)
INSERT INTO public.payment_methods (id, nama, tipe, gambar_url, deskripsi, aktif, created_at)
SELECT id, nama, 'qris', gambar_url, deskripsi, aktif, created_at
FROM public.qris_list
ON CONFLICT (id) DO NOTHING;

-- 4. Migrasi relasi campaigns.qris_id -> campaign_payment_methods
INSERT INTO public.campaign_payment_methods (campaign_id, payment_method_id)
SELECT c.id, c.qris_id
FROM public.campaigns c
WHERE c.qris_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();