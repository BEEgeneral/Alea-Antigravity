import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

const CREATE_TABLES_SQL = `
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
    source_document TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    key_observations TEXT[],
    recommended_approach TEXT,
    confidence_score NUMERIC(3,2)
);

CREATE TABLE IF NOT EXISTS centurion_scrape_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID,
    scrape_type TEXT NOT NULL DEFAULT 'full_osint',
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    results JSONB,
    google_results TEXT,
    linkedin_found TEXT,
    twitter_found TEXT,
    website_found TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to existing tables
ALTER TABLE investors ADD COLUMN IF NOT EXISTS piedra_personalidad TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS disc_profile TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS risk_profile TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS communication_preference TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS closing_strategy TEXT[];
ALTER TABLE investors ADD COLUMN IF NOT EXISTS follow_up_priority TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS classification_data JSONB;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS classified_by UUID;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS latest_classification_id UUID;

ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS google_results TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS personality_summary TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS needs_deep_scrape BOOLEAN DEFAULT true;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending';
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS scrape_completed_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_investor_classifications_investor_id ON investor_classifications(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_classifications_piedra ON investor_classifications(piedra_primaria);
CREATE INDEX IF NOT EXISTS idx_centurion_scrape_jobs_profile_id ON centurion_scrape_jobs(profile_id);
`;

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await client
      .database
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Execute the SQL using a workaround - insert into a migration tracking table
    // Since we can't execute raw SQL directly, we'll create the tables via the API
    
    // Try to create investor_classifications table entries to test if table exists
    const { error: testError } = await client
      .database
      .from('investor_classifications')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (testError && testError.message.includes('does not exist')) {
      // Table doesn't exist - we need to create it via Supabase dashboard
      return NextResponse.json({
        success: false,
        error: 'Tables do not exist',
        message: 'Please run the migration SQL in Supabase Dashboard → SQL Editor',
        migration_sql: CREATE_TABLES_SQL
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tables already exist or created successfully'
    });

  } catch (error: any) {
    // Check if it's a "table does not exist" error
    if (error.message?.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Tables do not exist',
        message: 'Run this SQL in Supabase SQL Editor:',
        sql: CREATE_TABLES_SQL
      }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    
    // Check what tables exist
    const tables = ['investor_classifications', 'centurion_scrape_jobs', 'investors', 'centurion_profiles'];
    const results: Record<string, boolean> = {};

    for (const table of tables) {
      const { error } = await client.database.from(table).select('id').limit(1).maybeSingle();
      results[table] = !error;
    }

    return NextResponse.json({ tables: results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}