-- Add jumlah_donatur column
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS jumlah_donatur integer NOT NULL DEFAULT 0;

-- Update trigger function to maintain jumlah_donatur alongside terkumpul
CREATE OR REPLACE FUNCTION public.update_campaign_terkumpul()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    UPDATE campaigns
    SET terkumpul = terkumpul + NEW.nominal,
        jumlah_donatur = jumlah_donatur + 1
    WHERE id = NEW.campaign_id;
  END IF;
  IF OLD.status = 'verified' AND NEW.status != 'verified' THEN
    UPDATE campaigns
    SET terkumpul = GREATEST(0, terkumpul - OLD.nominal),
        jumlah_donatur = GREATEST(0, jumlah_donatur - 1)
    WHERE id = OLD.campaign_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_update_campaign_terkumpul ON public.donations;
CREATE TRIGGER trg_update_campaign_terkumpul
AFTER UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_terkumpul();

-- Update sync function
CREATE OR REPLACE FUNCTION public.sync_campaign_terkumpul(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaigns
  SET terkumpul = COALESCE((
        SELECT SUM(nominal) FROM public.donations
        WHERE campaign_id = p_campaign_id AND status = 'verified'
      ), 0),
      jumlah_donatur = COALESCE((
        SELECT COUNT(*) FROM public.donations
        WHERE campaign_id = p_campaign_id AND status = 'verified'
      ), 0),
      updated_at = now()
  WHERE id = p_campaign_id;
END;
$function$;

-- Backfill jumlah_donatur for all existing campaigns
UPDATE public.campaigns c
SET jumlah_donatur = COALESCE(sub.cnt, 0)
FROM (
  SELECT campaign_id, COUNT(*) AS cnt
  FROM public.donations
  WHERE status = 'verified'
  GROUP BY campaign_id
) sub
WHERE sub.campaign_id = c.id;