import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('insforge_token')?.value;
    
    // Get body
    const body = await req.json();
    
    // Try to create authenticated client
    const client = await createAuthenticatedClient(req);
    const { data: { user }, error: userError } = await client.auth.getCurrentUser();
    
    return NextResponse.json({
      received: {
        authHeader: authHeader ? 'present' : 'missing',
        cookieToken: cookieToken ? 'present' : 'missing',
        bodyMessage: body.message || 'no message',
      },
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message || null,
      minimaxKeySet: !!process.env.MINIMAX_API_KEY,
      minimaxKeyLength: process.env.MINIMAX_API_KEY?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}