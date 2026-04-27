-- =====================
-- TABLE: site_settings
-- Menyimpan konfigurasi website yang bisa diubah dari admin panel
-- =====================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Siapapun bisa membaca settings (diperlukan agar Pixel bisa dimuat di halaman publik)
CREATE POLICY "Public can read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Hanya admin yang bisa mengubah settings
CREATE POLICY "Admins manage site_settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default rows
INSERT INTO public.site_settings (key, value) VALUES
  ('fb_pixel_id', ''),
  ('fb_pixel_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
