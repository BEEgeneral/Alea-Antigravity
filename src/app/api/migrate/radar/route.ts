import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile } = await client
      .database
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    // Check if signals table exists
    const { error: signalsError } = await client
      .database
      .from('signals')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!signalsError) {
      return NextResponse.json({ 
        success: true, 
        message: 'RADAR tables already exist',
        tables: ['signals', 'opportunities', 'trend_alerts']
      });
    }

    // Return SQL to run in InsForge Dashboard → SQL Editor
    return NextResponse.json({ 
      success: false,
      error: 'Tables do not exist',
      message: 'Run this SQL in InsForge Dashboard → Database → SQL Editor:',
      sql: `
-- ============================================================
-- RADAR ALEA - Intelligence System Tables
-- Run in: InsForge Dashboard → Database → SQL Editor
-- ============================================================

-- SIGNALS: Detección de oportunidades de fuentes externas
CREATE TABLE IF NOT EXISTS signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Identificación
    source TEXT NOT NULL CHECK (source IN ('boe', 'concursos', 'boletin_urbanistico', 'network', 'architect', 'century21', 'family_office', 'manual')),
    source_url TEXT,
    source_reference TEXT,
    
    -- Activo detectado
    title TEXT NOT NULL,
    asset_type TEXT CHECK (asset_type IN ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND', 'MIXED_USE', 'HOTEL', 'RETAIL', 'OFFICE', 'LOGISTICS')),
    location_hint TEXT,
    address TEXT,
    price numeric,
    price_raw TEXT,
    meters numeric,
    vendor_name TEXT,
    vendor_contact TEXT,
    description TEXT,
    
    -- Scoring Alea
    alea_score numeric DEFAULT 0,
    score_classification TEXT CHECK (score_classification IN ('exceptional', 'high', 'medium', 'low')),
    exclusivity_score numeric DEFAULT 0,
    access_score numeric DEFAULT 0,
    market_timing_score numeric DEFAULT 0,
    source_quality_score numeric DEFAULT 0,
    
    -- Estado del signal
    status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'analyzing', 'qualified', 'matched', 'opportunity', 'negotiating', 'closed', 'archived')),
    
    -- Fechas
    detected_at TIMESTAMPTZ DEFAULT now(),
    analyzed_at TIMESTAMPTZ,
    qualified_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Relaciones
    linked_property_id UUID,
    linked_investor_id UUID,
    linked_opportunity_id UUID,
    
    -- Datos extraídos del fuente
    raw_data JSONB,
    extracted_images TEXT[],
    attachment_urls TEXT[],
    
    -- Notas
    analyst_notes TEXT,
    rejection_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- OPPORTUNITIES: Pipeline de oportunidades
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referencias
    signal_id UUID,
    property_id UUID,
    investor_id UUID,
    lead_id UUID,
    
    -- Clasificación
    alea_score numeric DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('exceptional', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'in_progress', 'negotiating', 'offer', 'closing', 'closed', 'lost')),
    
    -- Pipeline
    pipeline_stage TEXT DEFAULT 'prospect' CHECK (pipeline_stage IN ('prospect', 'qualified', 'due_diligence', 'offer', 'closing')),
    match_score numeric,
    
    -- Timing
    detected_at TIMESTAMPTZ DEFAULT now(),
    first_contact_at TIMESTAMPTZ,
    nda_signed_at TIMESTAMPTZ,
    visit_scheduled_at TIMESTAMPTZ,
    offer_made_at TIMESTAMPTZ,
    closing_expected_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- 48h rule
    last_update_at TIMESTAMPTZ DEFAULT now(),
    sla_breached boolean DEFAULT false,
    sla_breach_notified boolean DEFAULT false,
    
    -- Valor
    estimated_value numeric,
    offered_price numeric,
    final_price numeric,
    
    -- Notas
    summary TEXT,
    closing_notes TEXT,
    loss_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys after tables exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS signal_id UUID REFERENCES signals(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES investors(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);

ALTER TABLE signals ADD COLUMN IF NOT EXISTS linked_property_id UUID REFERENCES properties(id);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS linked_investor_id UUID REFERENCES investors(id);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_source ON signals(source);
CREATE INDEX IF NOT EXISTS idx_signals_score ON signals(alea_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_detected ON signals(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline ON opportunities(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_detected ON opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_sla ON opportunities(last_update_at) WHERE status NOT IN ('closed', 'lost');

-- ============================================================
-- Add radar fields to existing tables if not exist
-- ============================================================

-- Add to properties for blind listings
ALTER TABLE properties ADD COLUMN IF NOT EXISTS blind_listing boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS blind_location_hint TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS radar_source TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS radar_signal_id UUID;

-- Add to investors for radar tracking
ALTER TABLE investors ADD COLUMN IF NOT EXISTS radar_match_count integer DEFAULT 0;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS last_radar_match_at TIMESTAMPTZ;

-- Add to leads for opportunity pipeline
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opportunity_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'prospect';
`
    }, { status: 400 });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check which tables exist
    const tables = ['signals', 'opportunities', 'trend_alerts'];
    const results: Record<string, { exists: boolean; count: number; sample?: any }> = {};

    for (const table of tables) {
      const { data, error } = await client
        .database
        .from(table)
        .select('id', { count: 'exact' })
        .limit(1);
      
      results[table] = {
        exists: !error,
        count: data ? (data as any)?.length || 0 : 0
      };
    }

    return NextResponse.json({ tables: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
