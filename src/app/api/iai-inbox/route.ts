import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge';

export async function GET(req: Request) {
  try {
    let token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const { data: authData, error: authError } = await client.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query = client.database
      .from('iai_inbox_suggestions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: suggestions, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      suggestions: suggestions || [],
      total: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}