import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET() {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: tokens } = await client
      .database
      .from('gmail_tokens')
      .select('id, expires_at, updated_at')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ 
      connected: !!tokens,
      expiresAt: tokens?.expires_at || null
    });

  } catch (error: any) {
    
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await client
      .database
      .from('gmail_tokens')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}