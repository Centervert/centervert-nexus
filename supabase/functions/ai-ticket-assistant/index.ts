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

The user has been asked to provide: client name, what needs to be done, deadline/due date, budget, priority level, and any other details.

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
1. Be conversational, friendly, and HIGHLY EFFICIENT - users have already been prompted to provide all key information
2. EXTRACT EVERYTHING from the first message: client, description, title (or generate from description), budget, due date, priority
3. If user provides comprehensive details in their first message, immediately call create_ticket with ALL extracted information
4. Generate a clear title from the description if not explicitly provided (e.g., "Build landing page for new product launch" → title: "Build landing page", description: full details)
5. Ask follow-up questions ONLY for the absolute minimum required fields that are truly missing:
   - Client (which client is this for?) - REQUIRED
   - Description (what needs to be done?) - REQUIRED
6. For optional fields, extract or infer intelligently:
   - Title: auto-generate from description if not provided (keep it under 80 chars, clear and actionable)
   - Priority: extract from language ("urgent", "asap", "critical" → urgent; "high priority", "important" → high; "low priority" → low; default → medium)
   - Category: auto-match based on keywords in description
   - Budget: extract any dollar amounts mentioned (e.g., "$2,500", "2.5k", "budget of 2500" → 2500)
   - Due date: extract dates/timeframes (e.g., "by Friday", "this week", "end of month", "March 15")
   - Assigned to: only if user explicitly mentions a person by name
7. CRITICAL: When a new client is created mid-conversation, immediately proceed with ticket creation using ALL the information the user already provided - DO NOT ask them to repeat details
8. If a client doesn't exist in the provided list, intelligently determine the client type from the user's description:
   - If they mention "client under [agency]", "end client of [agency]", "managed by [agency]" → agency_managed
   - If they mention "agency partner", "partner agency", or similar → agency
   - If they mention "direct client", "our client", or don't specify a managing agency → direct
   - If unclear, ask: "Is this a direct client, an agency partner, or a client managed by an agency?"
   Then call create_client, and IMMEDIATELY proceed with ticket creation using previously provided information
9. Match client names flexibly and case-insensitively (e.g., "google" matches "Google Inc.", "acme" matches "ACME Corp")
10. MAXIMIZE EFFICIENCY: If you have client + description, proceed to ticket creation immediately

Examples of efficient extraction:
- "Need to build a landing page for Google, budget is $5k, due next Friday, high priority" 
  → Extract: client=Google, title="Build landing page", description=full message, budget=5000, due_date=next Friday, priority=high
  → Immediately call create_ticket
  
- "Urgent bug fix for Acme Corp website - checkout page is broken, need it fixed asap"
  → Extract: client=Acme Corp, title="Fix checkout page bug", description=full message, priority=urgent
  → Immediately call create_ticket

Priority keywords:
- "urgent", "emergency", "critical", "asap", "now" → urgent
- "high priority", "important", "soon", "quickly" → high  
- "low priority", "when possible", "whenever", "eventually" → low
- default → medium

Category matching:
- Match category names flexibly based on keywords in the ticket description
- Common patterns: "landing page" → Landing Page, "email" → Email, "website" → Website, "bug" → Bug Fix
- If no clear match, leave empty

Agent assignment:
- Only assign if user explicitly mentions a person by name that matches an agent in the list
- Otherwise leave unassigned

Date extraction tips:
- "this week" → Friday of current week
- "next week" → Friday of next week  
- "by Friday", "this Friday" → next occurring Friday
- "end of month" → last day of current month
- Specific dates: "March 15", "3/15", "2024-03-15" → parse to ISO format YYYY-MM-DD`;

    // Define the tools for ticket and client creation
    const tools = [
      {
        type: "function",
        function: {
          name: "create_client",
          description: "Create a new client when the client mentioned doesn't exist in the system. Always ask for client_type before calling this.",
          parameters: {
            type: "object",
            properties: {
              name: { 
                type: "string", 
                description: "The name of the client company/organization" 
              },
              client_type: { 
                type: "string", 
                enum: ["direct", "agency", "agency_managed"],
                description: "Type of client: 'direct' (direct client), 'agency' (agency partner), or 'agency_managed' (end client managed by an agency)" 
              }
            },
            required: ["name", "client_type"]
          }
        }
      },
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

    // Check if AI called any tools
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      
      if (toolCall.function.name === 'create_client') {
        const clientData = JSON.parse(toolCall.function.arguments);
        
        // Return client creation request
        return new Response(
          JSON.stringify({ 
            type: 'create_client',
            clientData,
            message: choice.message.content || "Creating new client..."
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
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
