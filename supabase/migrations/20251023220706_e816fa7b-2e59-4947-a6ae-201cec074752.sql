-- Set ticket number sequence to start from a random number
-- This only affects NEW tickets - existing tickets keep their numbers
ALTER SEQUENCE tickets_ticket_number_seq RESTART WITH 45621;