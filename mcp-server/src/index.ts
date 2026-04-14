import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { createClient } from '@insforge/sdk';

const INSFORGE_APP_URL = process.env.INSFORGE_APP_URL || 'https://if8rkq6j.eu-central.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || '';
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';

// OAuth2 client for Gmail
const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  'http://localhost:3000/api/gmail/callback'
);

// Create InsForge client
function createInsForgeClient(token?: string) {
  return createClient({
    baseUrl: INSFORGE_APP_URL,
    anonKey: INSFORGE_API_KEY,
    token
  });
}

// Tools definition
const tools = [
  {
    name: 'get_agenda_actions',
    description: 'Get CRM agenda actions for an agent',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', description: 'Agent ID' },
        status: { type: 'string', description: 'Filter by status (pending, completed, etc.)' },
        limit: { type: 'number', description: 'Max results (default 50)' }
      }
    }
  },
  {
    name: 'create_agenda_action',
    description: 'Create a new agenda action in the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Action title' },
        description: { type: 'string', description: 'Action description' },
        action_type: { type: 'string', description: 'Type: call, email, meeting, document, follow_up, kyc, nda, loi, offer, closing' },
        priority: { type: 'string', description: 'Priority: low, medium, high, urgent, critical' },
        due_date: { type: 'string', description: 'Due date (ISO 8601)' },
        lead_id: { type: 'string', description: 'Associated lead ID' },
        assigned_agent_id: { type: 'string', description: 'Agent ID to assign' }
      },
      required: ['title', 'action_type', 'due_date']
    }
  },
  {
    name: 'update_agenda_action',
    description: 'Update an agenda action status',
    inputSchema: {
      type: 'object',
      properties: {
        action_id: { type: 'string', description: 'Action ID to update' },
        status: { type: 'string', description: 'New status' },
        outcome: { type: 'string', description: 'Outcome/notes' }
      },
      required: ['action_id']
    }
  },
  {
    name: 'get_gmail_emails',
    description: 'Get emails from Gmail for an agent',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', description: 'Agent ID' },
        query: { type: 'string', description: 'Gmail search query (e.g., "from:investor@example.com")' },
        max_results: { type: 'number', description: 'Max emails to fetch (default 10)' }
      }
    }
  },
  {
    name: 'send_gmail_email',
    description: 'Send an email via Gmail',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (HTML)' },
        cc?: { type: 'string', description: 'CC recipients' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'get_calendar_events',
    description: 'Get calendar events from Google Calendar',
    inputSchema: {
      type: 'object',
      properties: {
        time_min: { type: 'string', description: 'Start time (ISO 8601)' },
        time_max: { type: 'string', description: 'End time (ISO 8601)' },
        max_results: { type: 'number', description: 'Max events (default 50)' }
      }
    }
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Event title' },
        description: { type: 'string', description: 'Event description' },
        start_time: { type: 'string', description: 'Start time (ISO 8601)' },
        end_time: { type: 'string', description: 'End time (ISO 8601)' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee emails' },
        location: { type: 'string', description: 'Location' }
      },
      required: ['summary', 'start_time', 'end_time']
    }
  },
  {
    name: 'get_investors',
    description: 'Get investors from the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Max results' }
      }
    }
  },
  {
    name: 'get_leads',
    description: 'Get leads from the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        agent_id: { type: 'string', description: 'Filter by assigned agent' },
        limit: { type: 'number', description: 'Max results' }
      }
    }
  },
  {
    name: 'create_lead',
    description: 'Create a new lead in the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Lead name' },
        email: { type: 'string', description: 'Lead email' },
        phone: { type: 'string', description: 'Lead phone' },
        source: { type: 'string', description: 'Lead source' },
        notes: { type: 'string', description: 'Initial notes' }
      },
      required: ['name', 'email']
    }
  },
  {
    name: 'add_memory',
    description: 'Add a memory to the Memory Palace',
    inputSchema: {
      type: 'object',
      properties: {
        wing_name: { type: 'string', description: 'Wing name (e.g., investor_email@domain.com)' },
        room_name: { type: 'string', description: 'Room name' },
        hall_type: { type: 'string', description: 'Hall type: facts, events, discoveries, preferences, advice' },
        content: { type: 'string', description: 'Content to store' },
        importance: { type: 'number', description: 'Importance score 0-100' }
      },
      required: ['wing_name', 'room_name', 'hall_type', 'content']
    }
  },
  {
    name: 'get_memory_context',
    description: 'Get memory context for an entity',
    inputSchema: {
      type: 'object',
      properties: {
        wing_name: { type: 'string', description: 'Wing name' },
        limit: { type: 'number', description: 'Max memories to return' }
      },
      required: ['wing_name']
    }
  }
] as const;

// Create server
const server = new Server(
  {
    name: 'alea-crm-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to get Gmail service with token
async function getGmailService(gmailToken: string) {
  oauth2Client.setCredentials({
    access_token: gmailToken,
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Helper to get Calendar service
async function getCalendarService(gmailToken: string) {
  oauth2Client.setCredentials({
    access_token: gmailToken,
  });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Get InsForge token from env for server-side operations
    const insforge = createInsForgeClient();

    switch (name) {
      case 'get_agenda_actions': {
        const { agent_id, status, limit = 50 } = args as any;
        let query = insforge.database.from('agenda_actions')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(limit);

        if (agent_id) query = query.eq('assigned_agent_id', agent_id);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] };
      }

      case 'create_agenda_action': {
        const { title, description, action_type, priority, due_date, lead_id, assigned_agent_id } = args as any;
        const { data, error } = await insforge.database.from('agenda_actions')
          .insert({
            title,
            description,
            action_type,
            priority: priority || 'medium',
            due_date,
            lead_id,
            assigned_agent_id,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
      }

      case 'update_agenda_action': {
        const { action_id, status, outcome } = args as any;
        const { data, error } = await insforge.database.from('agenda_actions')
          .update({ status, outcome, updated_at: new Date().toISOString() })
          .eq('id', action_id)
          .select()
          .single();

        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
      }

      case 'get_gmail_emails': {
        const { query = 'in:inbox', max_results = 10 } = args as any;
        // Note: Requires Gmail OAuth token - this is for when user has connected Gmail
        const gmailToken = process.env.GMAIL_ACCESS_TOKEN;
        if (!gmailToken) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'Gmail not connected. Use /api/gmail/auth to connect.' }) }] };
        }

        const gmail = await getGmailService(gmailToken);
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: max_results
        });

        const messages = response.data.messages || [];
        const emailDetails = await Promise.all(
          messages.slice(0, max_results).map(async (msg: any) => {
            const email = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'metadata',
              metadataHeaders: ['from', 'subject', 'date']
            });
            return {
              id: msg.id,
              from: email.data.payload?.headers?.find((h: any) => h.name === 'From')?.value,
              subject: email.data.payload?.headers?.find((h: any) => h.name === 'Subject')?.value,
              date: email.data.payload?.headers?.find((h: any) => h.name === 'Date')?.value,
              snippet: email.data.snippet
            };
          })
        );

        return { content: [{ type: 'text', text: JSON.stringify(emailDetails, null, 2) }] };
      }

      case 'send_gmail_email': {
        const { to, subject, body, cc } = args as any;
        const gmailToken = process.env.GMAIL_ACCESS_TOKEN;
        if (!gmailToken) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'Gmail not connected' }) }] };
        }

        const gmail = await getGmailService(gmailToken);
        const message = [
          `To: ${to}`,
          cc ? `Cc: ${cc}` : '',
          'Content-Type: text/html;charset=utf-8',
          'From: me',
          `Subject: ${subject}`,
          '',
          body
        ].join('\n');

        const encodedMessage = Buffer.from(message).toString('base64url');
        const sent = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage }
        });

        return { content: [{ type: 'text', text: JSON.stringify(sent.data) }] };
      }

      case 'get_calendar_events': {
        const { time_min, time_max, max_results = 50 } = args as any;
        const gmailToken = process.env.GMAIL_ACCESS_TOKEN;
        if (!gmailToken) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'Gmail not connected' }) }] };
        }

        const calendar = await getCalendarService(gmailToken);
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: time_min,
          timeMax: time_max,
          maxResults: max_results,
          singleEvents: true,
          orderBy: 'startTime'
        });

        return { content: [{ type: 'text', text: JSON.stringify(response.data.items || [], null, 2) }] };
      }

      case 'create_calendar_event': {
        const { summary, description, start_time, end_time, attendees, location } = args as any;
        const gmailToken = process.env.GMAIL_ACCESS_TOKEN;
        if (!gmailToken) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'Gmail not connected' }) }] };
        }

        const calendar = await getCalendarService(gmailToken);
        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary,
            description,
            location,
            start: { dateTime: start_time },
            end: { dateTime: end_time },
            attendees: attendees?.map((email: string) => ({ email })),
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 30 }
              ]
            }
          }
        });

        return { content: [{ type: 'text', text: JSON.stringify(event.data) }] };
      }

      case 'get_investors': {
        const { status, limit = 50 } = args as any;
        let query = insforge.database.from('investors').select('*').limit(limit);
        if (status) query = query.eq('kyc_status', status);

        const { data, error } = await query;
        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] };
      }

      case 'get_leads': {
        const { status, agent_id, limit = 50 } = args as any;
        let query = insforge.database.from('leads').select('*').limit(limit);
        if (status) query = query.eq('status', status);
        if (agent_id) query = query.eq('assigned_agent_id', agent_id);

        const { data, error } = await query;
        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] };
      }

      case 'create_lead': {
        const { name, email, phone, source, notes } = args as any;
        const { data, error } = await insforge.database.from('leads')
          .insert({
            name,
            email,
            phone,
            source: source || 'mcp',
            notes,
            status: 'new'
          })
          .select()
          .single();

        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
      }

      case 'add_memory': {
        const { wing_name, room_name, hall_type, content, importance = 50 } = args as any;
        const { data, error } = await (insforge as any).rpc('add_memory_drawer', {
          p_wing_name: wing_name,
          p_room_name: room_name,
          p_hall_type: hall_type,
          p_content: content,
          p_metadata: JSON.stringify({ importance })
        });

        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify({ id: data }) }] };
      }

      case 'get_memory_context': {
        const { wing_name, limit = 10 } = args as any;
        const { data, error } = await (insforge as any).rpc('get_memory_context', {
          p_wing_name: wing_name,
          p_limit: limit
        });

        if (error) throw error;
        return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] };
      }

      default:
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }] };
    }
  } catch (error: any) {
    console.error(`Tool error (${name}):`, error);
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
      isError: true
    };
  }
});

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Alea CRM MCP Server running on stdio');
}

main().catch(console.error);
