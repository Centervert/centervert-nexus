-- Renumber existing tickets to align with new sequence
-- This is safe - ticket_number is only for display, all relationships use UUID
UPDATE tickets 
SET ticket_number = 45617 
WHERE id = '97a01fd2-aa64-4c93-86cf-ac3c347ce464';

UPDATE tickets 
SET ticket_number = 45618 
WHERE id = '253ef018-1a49-4fa4-8b75-c4811815a3e9';

UPDATE tickets 
SET ticket_number = 45619 
WHERE id = '67f4008f-7f6e-44e1-88e5-2043147f75af';

UPDATE tickets 
SET ticket_number = 45620 
WHERE id = '52a173a4-f34b-467d-bcca-de4b7cf6454a';