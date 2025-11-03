-- Enable realtime for opportunity messages
ALTER TABLE opportunity_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunity_messages;

-- Enable realtime for reactions
ALTER TABLE opportunity_message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunity_message_reactions;

ALTER TABLE ticket_message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_message_reactions;