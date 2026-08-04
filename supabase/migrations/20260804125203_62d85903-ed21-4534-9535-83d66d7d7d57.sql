REVOKE EXECUTE ON FUNCTION public.deal_elements_sync_score() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deals_profile_sync_score() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_deal_qualification_score(uuid) FROM PUBLIC, anon;