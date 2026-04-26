import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { data: updated, error } = await client
      .database.from('iai_inbox_suggestions')
      .update({
        status: 'rejected',
        rejected_by: authData.user.id,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestion: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}