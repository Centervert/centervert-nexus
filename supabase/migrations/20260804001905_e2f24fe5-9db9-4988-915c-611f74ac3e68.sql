ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS relationship_status text NOT NULL DEFAULT 'target_account';

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_relationship_status_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_relationship_status_check
  CHECK (relationship_status IN (
    'target_account','prospect_account','active_opportunity','customer',
    'former_customer','partner','vendor','inactive','do_not_contact'
  ));