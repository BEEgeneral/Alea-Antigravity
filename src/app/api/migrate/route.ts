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

    // Check if investor_classifications exists
    const { error: checkError } = await client
      .database
      .from('investor_classifications')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!checkError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tables already exist',
        tables: ['investor_classifications', 'centurion_scrape_jobs']
      });
    }

    // Table doesn't exist - we need to create it
    // Unfortunately InsForge doesn't support raw SQL execution via SDK
    // We need to create records one by one or use the dashboard
    
    return NextResponse.json({ 
      success: false,
      error: 'Tables do not exist',
      message: 'Run this SQL in InsForge Dashboard → Database → SQL Editor:',
      sql: `
-- Investor Personality Classification Tables
CREATE TABLE IF NOT EXISTS investor_classifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id UUID,
    investor_name TEXT NOT NULL,
    investor_email TEXT,
    company_name TEXT,
    piedra_primaria TEXT NOT NULL CHECK (piedra_primaria IN ('ZAFIRO', 'PERLA', 'ESMERALDA', 'RUBI')),
    piedra_secundaria TEXT,
    disc_profile TEXT NOT NULL CHECK (disc_profile IN ('D', 'I', 'S', 'C')),
    investor_type TEXT NOT NULL CHECK (investor_type IN ('FAMILY_OFFICE', 'HNW_INDIVIDUAL', 'INSTITUTIONAL', 'REAL_ESTATE_FUND', 'REGIONAL_INVESTOR', 'INTERNATIONAL_BUYER')),
    risk_profile TEXT NOT NULL CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
    communication_preference TEXT,
    closing_strategy TEXT[],
    follow_up_priority TEXT CHECK (follow_up_priority IN ('high', 'medium', 'low')),
    budget_range JSONB,
    estimated_decision_time TEXT,
    classification_data JSONB,
    source TEXT DEFAULT 'manual',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS centurion_scrape_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID,
    scrape_type TEXT DEFAULT 'full_osint',
    status TEXT DEFAULT 'pending',
    results JSONB,
    google_results TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to existing tables
ALTER TABLE investors ADD COLUMN IF NOT EXISTS piedra_personalidad TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS disc_profile TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS risk_profile TEXT;

ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS google_results TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS personality_summary TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending';
`
    }, { status: 400 });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}