/**
 * Network Signal API - RED Off-Market
 * 
 * Receives signals from:
 * - Telegram bot → n8n webhook → this API
 * - Notion form → n8n webhook → this API
 * - Direct from network (patrimonialistas, architects, Century 21, Family Offices)
 * 
 * Creates a signal in the signals table with source='network'
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerClient } from '@/lib/insforge-server';

export async function POST(req: Request) {
  try {
    // Allow unauthorized webhooks (from n8n with secret)
    const authHeader = req.headers.get('authorization');
    const webhookSecret = process.env.NETWORK_WEBHOOK_SECRET || 'aleasignature-network';
    
    let isAuthorized = false;
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token === webhookSecret) {
        isAuthorized = true;
      } else {
        // Try user auth
        try {
          const client = await createAuthenticatedClient(req as any);
          const { data: { user } } = await client.auth.getCurrentUser();
          if (user) {
            isAuthorized = true;
            userId = user.id;
          }
        } catch {
          isAuthorized = false;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Contact info
      contact_name,
      contact_email,
      contact_phone,
      contact_company,
      
      // Asset info
      title,
      asset_type,
      location_hint,
      address,
      price,
      price_raw,
      meters,
      description,
      
      // Source attribution
      network_source_type, // 'patrimonialista', 'architect', 'century21', 'family_office', 'other'
      network_source_name,
      network_source_contact,
      
      // Additional
      notes,
      attachments_urls,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'title es obligatorio' }, { status: 400 });
    }

    // Calculate Alea score
    let alea_score = 60; // Network starts higher
    if (network_source_type === 'patrimonialista') alea_score += 15;
    else if (network_source_type === 'architect') alea_score += 10;
    else if (network_source_type === 'century21') alea_score += 5;
    else if (network_source_type === 'family_office') alea_score += 10;

    if (price && price < 2000000) alea_score += 10;
    if (meters && meters > 1000) alea_score += 10;
    alea_score = Math.min(100, alea_score);

    let score_classification = 'medium';
    if (alea_score >= 80) score_classification = 'exceptional';
    else if (alea_score >= 65) score_classification = 'high';
    else if (alea_score >= 45) score_classification = 'medium';
    else score_classification = 'low';

    const client = createServerClient();
    
    // If we have a contact, create a lead first
    let leadId: string | null = null;
    if (contact_name || contact_email) {
      const { data: lead, error: leadError } = await client
        .database
        .from('leads')
        .insert({
          name: contact_name || title,
          email: contact_email || '',
          phone: contact_phone || '',
          source: `network_${network_source_type || 'manual'}`,
          status: 'new',
          investor: network_source_name || contact_company || contact_name,
        })
        .select()
        .single();
      
      if (!leadError && lead) {
        leadId = lead.id;
      }
    }

    // Create the signal
    const { data: signal, error: signalError } = await client
      .database
      .from('signals')
      .insert({
        source: 'network',
        source_reference: network_source_name || contact_company || 'RED Alea',
        title,
        asset_type: normalizeAssetType(asset_type),
        location_hint: location_hint || address || '',
        address,
        price,
        price_raw,
        meters,
        vendor_name: contact_name || network_source_name,
        vendor_contact: contact_email || contact_phone,
        description: notes || description,
        alea_score,
        score_classification,
        status: 'detected',
        raw_data: {
          network_source_type,
          network_source_name,
          network_source_contact,
          contact_company,
          lead_id: leadId,
        },
        attachment_urls: attachments_urls,
        created_by: userId,
      })
      .select()
      .single();

    if (signalError) throw signalError;

    return NextResponse.json({
      success: true,
      signal_id: signal.id,
      lead_id: leadId,
      alea_score,
      message: 'Signal creado correctamente',
    });

  } catch (error: any) {
    console.error('Network signal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function normalizeAssetType(type: string): string {
  if (!type) return 'RESIDENTIAL';
  const t = type.toUpperCase();
  if (t.includes('HOTEL')) return 'HOTEL';
  if (t.includes('RETAIL') || t.includes('COMERCIAL')) return 'RETAIL';
  if (t.includes('OFFICE') || t.includes('OFICINA')) return 'OFFICE';
  if (t.includes('LOGIST') || t.includes('INDUST')) return 'INDUSTRIAL';
  if (t.includes('SUELO') || t.includes('LAND')) return 'LAND';
  if (t.includes('MIXED') || t.includes('MIXTO')) return 'MIXED_USE';
  return 'RESIDENTIAL';
}
