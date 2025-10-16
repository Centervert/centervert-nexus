import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface TicketContext {
  clients: Array<{ id: string; name: string; client_type: string }>;
  categories: Array<{ id: string; name: string }>;
  agents: Array<{ id: string; full_name: string; email: string }>;
  currentUser: { id: string; email: string; full_name: string };
}

interface TicketData {
  title: string;
  description: string;
  client_id: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: string;
  assigned_to?: string;
  due_date?: string;
  budget?: number;
  type?: string;
  subtype?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context }: { messages: Message[]; context: TicketContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const systemPrompt = `You are a helpful AI assistant for a ticketing system. Your job is to help users create support tickets through natural conversation.

Context you have access to:

CLIENTS:
${context.clients.map(c => `- ${c.name} (ID: ${c.id}, Type: ${c.client_type})`).join('\n')}

CATEGORIES:
${context.categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

AVAILABLE AGENTS:
${context.agents.map(a => `- ${a.full_name} (ID: ${a.id}, Email: ${a.email})`).join('\n')}

CURRENT USER:
- Name: ${context.currentUser.full_name}
- Email: ${context.currentUser.email}
- ID: ${context.currentUser.id}

Your behavior:
1. Be conversational, friendly, and efficient
2. When users describe what they need, extract ticket information
3. Ask follow-up questions ONLY for required fields that are missing:
   - Title (what is the ticket about?)
   - Description (details of what needs to be done)
   - Client (which client is this for?)
4. For optional fields, use smart defaults or ask only if relevant:
   - Priority: default to "medium" unless urgency is mentioned
   - Category: infer from description if possible
   - Assigned to: ask if specific expertise is needed
   - Due date: only ask if time-sensitive
   - Budget: only ask if costs are mentioned
5. Never ask all questions at once - have a natural conversation
6. When you have the required information (title, description, client_id), call the create_ticket tool
7. Match client names flexibly (e.g., "Google" matches "Google Inc.")
8. Be helpful in understanding what the user wants

Priority keywords:
- "urgent", "emergency", "critical", "asap" → urgent
- "high priority", "important", "soon" → high  
- "low priority", "when possible", "whenever" → low
- default → medium

Category matching:
- Match category names flexibly based on the ticket description
- If unclear, ask the user or leave it empty

Agent assignment:
- Only assign if user mentions a specific person or if expertise is clearly needed
- Otherwise leave unassigned`;

    // Define the tool for ticket creation
    const tools = [
      {
        type: "function",
        function: {
          name: "create_ticket",
          description: "Create a support ticket with the provided information. Only call this when you have the required fields: title, description, and client_id.",
          parameters: {
            type: "object",
            properties: {
              title: { 
                type: "string", 
                description: "Brief, clear title of the ticket (e.g., 'Fix login bug on mobile app')" 
              },
              description: { 
                type: "string", 
                description: "Detailed description of what needs to be done, including any context or requirements" 
              },
              client_id: { 
                type: "string", 
                description: "UUID of the client this ticket is for. Must match one of the client IDs from the context." 
              },
              priority: { 
                type: "string", 
                enum: ["low", "medium", "high", "urgent"],
                description: "Priority level of the ticket. Default to 'medium' if not specified." 
              },
              category_id: { 
                type: "string", 
                description: "UUID of the category. Optional - only include if you can confidently match to a category from context." 
              },
              assigned_to: { 
                type: "string", 
                description: "UUID of the agent to assign. Optional - only include if user specifically mentions an agent." 
              },
              due_date: { 
                type: "string", 
                description: "Due date in ISO format (YYYY-MM-DD). Optional - only include if user mentions a deadline." 
              },
              budget: { 
                type: "number", 
                description: "Budget amount in dollars. Optional - only include if user mentions costs." 
              },
              type: { 
                type: "string", 
                description: "Type of ticket (e.g., 'bug', 'feature', 'support'). Optional." 
              },
              subtype: { 
                type: "string", 
                description: "Subtype of ticket for more specific categorization. Optional." 
              }
            },
            required: ["title", "description", "client_id"]
          }
        }
      }
    ];

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'rate_limit', 
            message: 'Too many requests. Please wait a moment and try again.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'payment_required', 
            message: 'AI credits exhausted. Please add credits in workspace settings.' 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No response from AI');
    }

    // Check if AI called the create_ticket tool
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function.name === 'create_ticket') {
        const ticketData: TicketData = JSON.parse(toolCall.function.arguments);
        
        // Return structured ticket data
        return new Response(
          JSON.stringify({ 
            type: 'ticket_data',
            ticketData,
            message: choice.message.content || "I've extracted the ticket information. Please review and create the ticket."
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Return conversational response
    return new Response(
      JSON.stringify({ 
        type: 'message',
        message: choice.message.content 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-ticket-assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
