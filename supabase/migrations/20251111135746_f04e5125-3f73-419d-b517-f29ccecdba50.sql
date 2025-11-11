-- Add 'on_hold' to the ticket_status enum
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'on_hold';