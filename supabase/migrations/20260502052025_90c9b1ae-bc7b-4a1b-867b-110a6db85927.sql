-- Revoke EXECUTE on sync_campaign_terkumpul from anon and public
REVOKE EXECUTE ON FUNCTION public.sync_campaign_terkumpul(uuid) FROM anon, public;

-- Add updated_at trigger on campaigns table
CREATE TRIGGER trg_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign keys to campaign_payment_methods
ALTER TABLE public.campaign_payment_methods
  ADD CONSTRAINT fk_cpm_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_cpm_payment_method FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE CASCADE;

-- Add foreign key to donations
ALTER TABLE public.donations
  ADD CONSTRAINT fk_donations_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Add foreign key to campaign_visits
ALTER TABLE public.campaign_visits
  ADD CONSTRAINT fk_visits_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;