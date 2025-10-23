-- Add new ticket statuses for acknowledgment and payment tracking
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'pending_acknowledgment';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'awaiting_payment';

-- Add acknowledgment tracking columns to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS revision_notes TEXT;