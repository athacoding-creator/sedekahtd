ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS pesan TEXT;

CREATE OR REPLACE VIEW public.public_donations
WITH (security_invoker = true)
AS
SELECT id, nama, nominal, pesan, created_at, campaign_id
FROM public.donations
WHERE status = 'verified'
ORDER BY created_at DESC;

GRANT SELECT ON public.public_donations TO anon, authenticated;

-- Allow anon/authenticated to read verified donations through the view
CREATE POLICY "Public can view verified donations"
  ON public.donations FOR SELECT
  USING (status = 'verified');

-- Seed beberapa donasi verified contoh
INSERT INTO public.donations (campaign_id, nama, nominal, metode_pembayaran, status, pesan, created_at)
SELECT id, 'Hamba Allah', 50000, 'QRIS', 'verified', 'Semoga bermanfaat', now() - interval '2 day' FROM public.campaigns LIMIT 1;
INSERT INTO public.donations (campaign_id, nama, nominal, metode_pembayaran, status, pesan, created_at)
SELECT id, 'Ahmad', 100000, 'Transfer Bank', 'verified', 'Barakallah', now() - interval '5 day' FROM public.campaigns LIMIT 1;
INSERT INTO public.donations (campaign_id, nama, nominal, metode_pembayaran, status, pesan, created_at)
SELECT id, 'Sahabat BerkahKita', 250000, 'E-wallet', 'verified', 'Untuk saudara kita', now() - interval '7 day' FROM public.campaigns LIMIT 1;
INSERT INTO public.donations (campaign_id, nama, nominal, metode_pembayaran, status, pesan, created_at)
SELECT id, 'Siti', 25000, 'QRIS', 'verified', NULL, now() - interval '10 day' FROM public.campaigns LIMIT 1;
INSERT INTO public.donations (campaign_id, nama, nominal, metode_pembayaran, status, pesan, created_at)
SELECT id, 'Hamba Allah', 75000, 'Transfer Bank', 'verified', 'Semoga jadi pemberat amal', now() - interval '14 day' FROM public.campaigns LIMIT 1;