import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createClientWithToken } from '@/lib/insforge-server';
import pool from '@/lib/vps-pg';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createClientWithToken(token);
    const { data: authData, error: authError } = await client.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;

    const suggestionResult = await pool.query(
      'SELECT * FROM iai_inbox_suggestions WHERE id = $1',
      [id]
    );
    const suggestion = suggestionResult.rows[0];

    if (!suggestion) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    let createData: any = null;

    if (suggestion.suggestion_type === 'investor' || suggestion.suggestion_type === 'lead') {
      const investorResult = await pool.query(
        `INSERT INTO investors (email, full_name, phone, budget_min, budget_max, kyc_status, source)
         VALUES ($1, $2, $3, $4, $5, 'pending', 'email_intelligence')
         RETURNING id`,
        [
          suggestion.sender_email,
          suggestion.extracted_data?.contact_name || suggestion.extracted_data?.vendor_name || suggestion.sender_email.split('@')[0],
          suggestion.extracted_data?.contact_phone || null,
          suggestion.extracted_data?.price ? suggestion.extracted_data.price * 0.7 : null,
          suggestion.extracted_data?.price || null,
        ]
      );

      if (investorResult.rows.length > 0) {
        createData = { type: 'investor', id: investorResult.rows[0]?.id };
      }
    }

    if (suggestion.suggestion_type === 'property') {
      const propertyResult = await pool.query(
        `INSERT INTO properties (title, address, asset_type, price, size_sqm, is_off_market, is_published, source)
         VALUES ($1, $2, $3, $4, $5, true, false, 'email_intelligence')
         RETURNING id`,
        [
          suggestion.extracted_data?.title || suggestion.original_email_subject,
          suggestion.extracted_data?.address || 'Por confirmar',
          suggestion.extracted_data?.type || 'Otro',
          suggestion.extracted_data?.price || 0,
          suggestion.extracted_data?.meters || null,
        ]
      );

      if (propertyResult.rows.length > 0) {
        createData = { type: 'property', id: propertyResult.rows[0]?.id };
      }
    }

    const updatedResult = await pool.query(
      `UPDATE iai_inbox_suggestions 
       SET status = 'approved', approved_by = $1, approved_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [authData.user.id, id]
    );

    if (updatedResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestion: updatedResult.rows[0],
      created: createData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
