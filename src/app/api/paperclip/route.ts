import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

const PAPERCLIP_URL = process.env.PAPERCLIP_API_URL || 'http://localhost:3100';
const PAPERCLIP_KEY = process.env.PAPERCLIP_API_KEY || '';

async function paperclipRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${PAPERCLIP_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAPERCLIP_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Paperclip API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
        try {
          const health = await paperclipRequest('/health');
          return NextResponse.json({ connected: true, status: health });
        } catch {
          return NextResponse.json({ 
            connected: false, 
            status: 'Paperclip not running',
            hint: 'Run: npx paperclipai dev'
          });
        }
      }

      case 'agents': {
        try {
          const agents = await paperclipRequest('/api/agents');
          return NextResponse.json({ agents });
        } catch {
          return NextResponse.json({ agents: [], error: 'Cannot connect to Paperclip' });
        }
      }

      case 'tasks': {
        try {
          const tasks = await paperclipRequest('/api/tasks?limit=20');
          return NextResponse.json({ tasks });
        } catch {
          return NextResponse.json({ tasks: [], error: 'Cannot connect to Paperclip' });
        }
      }

      case 'company': {
        try {
          const company = await paperclipRequest('/api/company');
          return NextResponse.json({ company });
        } catch {
          return NextResponse.json({ company: null, error: 'Cannot connect to Paperclip' });
        }
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, agentId, prompt, context } = await req.json();

    if (!agentId || !prompt) {
      return NextResponse.json({ error: 'agentId and prompt required' }, { status: 400 });
    }

    switch (action) {
      case 'run_task': {
        const task = await paperclipRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ agentId, prompt, context }),
        });
        return NextResponse.json({ task });
      }

      case 'spawn': {
        const result = await paperclipRequest(`/api/agents/${agentId}/spawn`, {
          method: 'POST',
        });
        return NextResponse.json({ result });
      }

      case 'run_pelayo': {
        // Special endpoint to run Pelayo agent
        const task = await paperclipRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            agentId: 'pelayo',
            prompt,
            context: {
              ...context,
              skills: ['alea_crm', 'alea_memory', 'alea_properties'],
            }
          }),
        });
        return NextResponse.json({ task });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
