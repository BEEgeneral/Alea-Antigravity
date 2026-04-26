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

    const { data: suggestion, error: fetchError } = await client
      .database.from('iai_inbox_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !suggestion) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    let createData: any = null;

    if (suggestion.suggestion_type === 'investor' || suggestion.suggestion_type === 'lead') {
      const { data: investor, error: investorError } = await client
        .database.from('investors')
        .insert({
          email: suggestion.sender_email,
          full_name: suggestion.extracted_data?.contact_name || suggestion.extracted_data?.vendor_name || suggestion.sender_email.split('@')[0],
          phone: suggestion.extracted_data?.contact_phone || null,
          budget_min: suggestion.extracted_data?.price ? suggestion.extracted_data.price * 0.7 : null,
          budget_max: suggestion.extracted_data?.price || null,
          kyc_status: 'pending',
          source: 'email_intelligence',
        })
        .select('id')
        .single();

      if (investorError && !investorError.message.includes('duplicate')) {
        console.error('Error creating investor:', investorError);
      } else {
        createData = { type: 'investor', id: investor?.id };
      }
    }

    if (suggestion.suggestion_type === 'property') {
      const { data: property, error: propertyError } = await client
        .database.from('properties')
        .insert({
          title: suggestion.extracted_data?.title || suggestion.original_email_subject,
          address: suggestion.extracted_data?.address || 'Por confirmar',
          asset_type: suggestion.extracted_data?.type || 'Otro',
          price: suggestion.extracted_data?.price || 0,
          size_sqm: suggestion.extracted_data?.meters || null,
          is_off_market: true,
          is_published: false,
          source: 'email_intelligence',
        })
        .select('id')
        .single();

      if (propertyError && !propertyError.message.includes('duplicate')) {
        console.error('Error creating property:', propertyError);
      } else {
        createData = { type: 'property', id: property?.id };
      }
    }

    const { data: updated, error: updateError } = await client
      .database.from('iai_inbox_suggestions')
      .update({
        status: 'approved',
        approved_by: authData.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestion: updated,
      created: createData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}