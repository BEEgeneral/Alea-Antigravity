-- Investor Personality Classification Tables for Alea Signature
-- Based on "Piedras Preciosas" methodology + TARGET DISC

-- Table: investor_classifications
-- Stores all investor personality classifications
CREATE TABLE IF NOT EXISTS investor_classifications (
    id UUID DEFAULT gen_random_uuid(),
    investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
    investor_name TEXT NOT NULL,
    investor_email TEXT,
    company_name TEXT,
    
    -- Piedras Preciosas personality
    piedra_primaria TEXT NOT NULL CHECK (piedra_primaria IN ('ZAFIRO', 'PERLA', 'ESMERALDA', 'RUBI')),
    piedra_secundaria TEXT CHECK (piedra_secundaria IN ('ZAFIRO', 'PERLA', 'ESMERALDA', 'RUBI', NULL)),
    
    -- DISC profile
    disc_profile TEXT NOT NULL CHECK (disc_profile IN ('D', 'I', 'S', 'C')),
    
    -- Investor type classification
    investor_type TEXT NOT NULL CHECK (investor_type IN ('FAMILY_OFFICE', 'HNW_INDIVIDUAL', 'INSTITUTIONAL', 'REAL_ESTATE_FUND', 'REGIONAL_INVESTOR', 'INTERNATIONAL_BUYER')),
    risk_profile TEXT NOT NULL CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
    
    -- Communication and closing preferences
    communication_preference TEXT,
    closing_strategy TEXT[],
    follow_up_priority TEXT CHECK (follow_up_priority IN ('high', 'medium', 'low')),
    
    -- Budget and timing
    budget_range JSONB,
    estimated_decision_time TEXT,
    
    -- Full classification data as JSON
    classification_data JSONB,
    
    -- Source tracking
    source TEXT DEFAULT 'manual',
    source_document TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Notes from classification
    key_observations TEXT[],
    recommended_approach TEXT,
    confidence_score NUMERIC(3,2)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_investor_classifications_investor_id ON investor_classifications(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_classifications_piedra ON investor_classifications(piedra_primaria);
CREATE INDEX IF NOT EXISTS idx_investor_classifications_investor_type ON investor_classifications(investor_type);
CREATE INDEX IF NOT EXISTS idx_investor_classifications_created_at ON investor_classifications(created_at DESC);

-- Table: centurion_scrape_jobs
-- Tracks OSINT scrape jobs for profiles
CREATE TABLE IF NOT EXISTS centurion_scrape_jobs (
    id UUID DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES centurion_profiles(id) ON DELETE CASCADE,
    scrape_type TEXT NOT NULL DEFAULT 'full_osint',
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- Results
    results JSONB,
    google_results TEXT,
    linkedin_found TEXT,
    twitter_found TEXT,
    website_found TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_centurion_scrape_jobs_profile_id ON centurion_scrape_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_centurion_scrape_jobs_status ON centurion_scrape_jobs(status);

-- Add columns to existing investors table
ALTER TABLE investors ADD COLUMN IF NOT EXISTS piedra_personalidad TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS disc_profile TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS investor_type_new TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS risk_profile TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS communication_preference TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS closing_strategy TEXT[];
ALTER TABLE investors ADD COLUMN IF NOT EXISTS follow_up_priority TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS classification_data JSONB;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS classified_by UUID;

-- Add columns to centurion_profiles for OSINT results
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS google_results TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS personality_summary TEXT;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS needs_deep_scrape BOOLEAN DEFAULT true;
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending';
ALTER TABLE centurion_profiles ADD COLUMN IF NOT EXISTS scrape_completed_at TIMESTAMPTZ;

-- Add foreign key to investors for classification
ALTER TABLE investors ADD COLUMN IF NOT EXISTS latest_classification_id UUID REFERENCES investor_classifications(id);

-- RLS Policies

-- Enable RLS
ALTER TABLE investor_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE centurion_scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: investors can see all classifications (they are admin users)
CREATE POLICY "Admin users can view all classifications"
    ON investor_classifications FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin users can insert classifications"
    ON investor_classifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin users can update classifications"
    ON investor_classifications FOR UPDATE
    TO authenticated
    USING (true);

-- Policy for scrape jobs
CREATE POLICY "Admin users can manage scrape jobs"
    ON centurion_scrape_jobs FOR ALL
    TO authenticated
    USING (true);