-- Update opportunity_status enum with new values
ALTER TYPE opportunity_status RENAME TO opportunity_status_old;

CREATE TYPE opportunity_status AS ENUM (
  'new',
  'in_talks',
  'working_on_proposal',
  'proposal_submitted',
  'approved',
  'declined',
  'see_activity'
);

ALTER TABLE opportunities 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE opportunities 
  ALTER COLUMN status TYPE opportunity_status 
  USING (
    CASE status::text
      WHEN 'lead' THEN 'new'::opportunity_status
      WHEN 'working_on_rfp' THEN 'working_on_proposal'::opportunity_status
      WHEN 'submitted' THEN 'proposal_submitted'::opportunity_status
      WHEN 'awarded' THEN 'approved'::opportunity_status
      WHEN 'lost' THEN 'declined'::opportunity_status
      WHEN 'on_hold' THEN 'see_activity'::opportunity_status
      ELSE 'new'::opportunity_status
    END
  );

ALTER TABLE opportunities 
  ALTER COLUMN status SET DEFAULT 'new'::opportunity_status;

DROP TYPE opportunity_status_old;