-- Roles enum & table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  gambar_url TEXT,
  target BIGINT NOT NULL DEFAULT 0,
  terkumpul BIGINT NOT NULL DEFAULT 0,
  kategori TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns"
  ON public.campaigns FOR SELECT
  USING (true);

CREATE POLICY "Admins manage campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  nominal BIGINT NOT NULL CHECK (nominal > 0),
  metode_pembayaran TEXT NOT NULL,
  bukti_transfer TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create donation"
  ON public.donations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view all donations"
  ON public.donations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update donations"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: when donation marked verified, add nominal to campaign.terkumpul
CREATE OR REPLACE FUNCTION public.update_campaign_terkumpul()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') AND NEW.campaign_id IS NOT NULL THEN
    UPDATE public.campaigns
    SET terkumpul = terkumpul + NEW.nominal,
        updated_at = now()
    WHERE id = NEW.campaign_id;
    NEW.verified_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER donations_verify_trigger
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_terkumpul();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('campaigns', 'campaigns', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('bukti-transfer', 'bukti-transfer', false);

CREATE POLICY "Public read campaign images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaigns');

CREATE POLICY "Admins manage campaign images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'campaigns' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'campaigns' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can upload bukti"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bukti-transfer');

CREATE POLICY "Admins read bukti"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'bukti-transfer' AND public.has_role(auth.uid(), 'admin'));

-- Seed campaigns
INSERT INTO public.campaigns (judul, deskripsi, gambar_url, target, terkumpul, kategori) VALUES
  ('Bantuan Kemanusiaan untuk Palestina', 'Salurkan donasi terbaik Anda untuk membantu saudara kita di Palestina yang sedang membutuhkan bantuan pangan, medis, dan tempat tinggal darurat. Setiap rupiah yang Anda berikan sangat berarti bagi mereka.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', 500000000, 187500000, 'Kemanusiaan'),
  ('Pembangunan Masjid Al-Hidayah', 'Mari bersama-sama mewujudkan rumah Allah yang nyaman untuk beribadah. Pembangunan Masjid Al-Hidayah membutuhkan dukungan dari para dermawan agar segera dapat digunakan oleh jamaah.', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800', 1000000000, 425000000, 'Pembangunan'),
  ('Santunan Anak Yatim Piatu', 'Berbagi kebahagiaan dengan anak-anak yatim piatu. Donasi Anda akan disalurkan dalam bentuk pakaian, perlengkapan sekolah, dan kebutuhan harian mereka.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', 200000000, 156000000, 'Sosial'),
  ('Beasiswa Pendidikan Dhuafa', 'Bantu wujudkan mimpi anak-anak dhuafa untuk mengenyam pendidikan yang layak. Donasi Anda menjadi jembatan masa depan mereka.', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 300000000, 89000000, 'Pendidikan');