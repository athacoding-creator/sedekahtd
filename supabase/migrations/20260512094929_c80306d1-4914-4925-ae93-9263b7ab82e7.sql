ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS tombol_teks text,
  ADD COLUMN IF NOT EXISTS tombol_warna text;