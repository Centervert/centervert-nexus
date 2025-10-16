import { supabase } from '@/integrations/supabase/client';

interface TicketNotificationData {
  to_email: string;
  to_name: string;
  ticket_number: number;
  ticket_title: string;
  ticket_id: string;
  event_type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'comment_added';
  actor_name: string;
  details?: string;
}

interface QuoteNotificationData {
  to_email: string;
  to_name: string;
  ticket_number: number;
  ticket_title: string;
  ticket_id: string;
  quote_amount: number;
  event_type: 'created' | 'approved' | 'declined' | 'expired';
  actor_name?: string;
  deliverables?: string[];
}

interface MilestoneNotificationData {
  to_email: string;
  to_name: string;
  ticket_number: number;
  ticket_title: string;
  ticket_id: string;
  milestone_title: string;
  milestone_type: string;
  milestone_status: string;
  actor_name: string;
}

interface UserInviteData {
  email: string;
  inviter_name: string;
  role: string;
  client_name?: string;
  token: string;
}

// Helper function to send emails without blocking UI
const sendEmailAsync = async (functionName: string, data: any) => {
  try {
    const { error } = await supabase.functions.invoke(functionName, {
      body: data,
    });
    if (error) {
      console.error(`Error sending ${functionName}:`, error);
    }
  } catch (error) {
    console.error(`Failed to invoke ${functionName}:`, error);
  }
};

export const sendTicketNotification = async (data: TicketNotificationData) => {
  await sendEmailAsync('send-ticket-notification', data);
};

export const sendQuoteNotification = async (data: QuoteNotificationData) => {
  await sendEmailAsync('send-quote-notification', data);
};

export const sendMilestoneNotification = async (data: MilestoneNotificationData) => {
  await sendEmailAsync('send-milestone-notification', data);
};

export const sendUserInvite = async (data: UserInviteData) => {
  await sendEmailAsync('send-user-invite', data);
};

// Helper to get user details for notifications
export const getUserDetails = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();
  
  return profile;
};

// Helper to get ticket details
export const getTicketDetails = async (ticketId: string) => {
  const { data: ticket } = await supabase
    .from('tickets')
    .select('ticket_number, title, created_by, assigned_to')
    .eq('id', ticketId)
    .single();
  
  return ticket;
};
