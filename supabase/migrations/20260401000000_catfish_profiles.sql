-- Alea Catfish - Fichas de Atención y Personalidad
-- Para cada persona/empresa detectada en documentos/emails

CREATE TABLE IF NOT EXISTS catfish_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación básica
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    company_role VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    
    -- OSINT Data (scraped)
    linkedin_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    google_results TEXT,
    
    -- Ficha de Atención y Personalidad
    communication_style TEXT CHECK (communication_style IN ('formal', 'semi_formal', 'informal', 'very_informal')),
    tone_preference TEXT CHECK (tone_preference IN ('professional', 'friendly', 'direct', 'persuasive', 'empathetic', 'assertive')),
    preferred_language VARCHAR(50) DEFAULT 'es',
    best_contact_time VARCHAR(100),
    best_contact_method TEXT CHECK (best_contact_method IN ('email', 'phone', 'whatsapp', 'linkedin', 'meeting', 'video_call')),
    
    -- Personalidad (basada en análisis)
    personality_type VARCHAR(50), -- ej. "Analítico", "Social", "Decisivo", "Cauteloso"
    decision_maker BOOLEAN DEFAULT false,
    influence_level VARCHAR(50) CHECK (influence_level IN ('low', 'medium', 'high', 'decision_maker', 'influencer')),
    
    -- Psychographic
    interests TEXT[],
    values TEXT[],
    pain_points TEXT[],
    
    -- Historial con Alea
    first_contact_date DATE,
    last_contact_date DATE,
    interaction_count INTEGER DEFAULT 0,
    sentiment_trend VARCHAR(50) CHECK (sentiment_trend IN ('positive', 'neutral', 'negative', 'improving', 'declining')),
    
    -- Notes privados para el agente
    private_notes TEXT,
    agent_visible_notes TEXT,
    
    -- Source del perfil
    source_type TEXT CHECK (source_type IN ('email_analysis', 'document_analysis', 'manual', 'linkedin_scrape', 'web_scrape')),
    source_id UUID, -- ID del email o documento origen
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    needs_deep_scrape BOOLEAN DEFAULT false,
    scrape_status VARCHAR(50) DEFAULT 'pending' CHECK (scrape_status IN ('pending', 'in_progress', 'completed', 'failed', 'not_needed')),
    
    -- Access control
    created_by UUID REFERENCES auth.users(id),
    assigned_agent_id UUID REFERENCES agents(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_catfish_profiles_name ON catfish_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_catfish_profiles_company ON catfish_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_catfish_profiles_email ON catfish_profiles(email);
CREATE INDEX IF NOT EXISTS idx_catfish_profiles_scrape_status ON catfish_profiles(scrape_status);
CREATE INDEX IF NOT EXISTS idx_catfish_profiles_assigned ON catfish_profiles(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_catfish_profiles_created_by ON catfish_profiles(created_by);

-- RLS Policies
ALTER TABLE catfish_profiles ENABLE ROW LEVEL SECURITY;

-- Agents can view assigned profiles
CREATE POLICY "Agents can view assigned catfish profiles"
ON catfish_profiles FOR SELECT
TO authenticated
USING (
    assigned_agent_id IN (SELECT id FROM agents WHERE id = auth.uid() AND is_approved = true)
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Agents can insert catfish profiles
CREATE POLICY "Agents can insert catfish profiles"
ON catfish_profiles FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND is_approved = true)
);

-- Agents can update own profiles
CREATE POLICY "Agents can update catfish profiles"
ON catfish_profiles FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR assigned_agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

-- Allow service role full access
CREATE POLICY "Service role full access catfish"
ON catfish_profiles FOR ALL
TO service_role
USING (true);

-- Tabla para tracking de scraping jobs
CREATE TABLE IF NOT EXISTS catfish_scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES catfish_profiles(id) ON DELETE CASCADE,
    scrape_type TEXT CHECK (scrape_type IN ('linkedin', 'google', 'twitter', 'instagram', 'full_osint')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    results JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catfish_scrape_jobs_profile ON catfish_scrape_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_catfish_scrape_jobs_status ON catfish_scrape_jobs(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_catfish_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER catfish_profiles_updated_at
    BEFORE UPDATE ON catfish_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_catfish_updated_at();

-- Agregar columna has_catfish_access a agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS has_catfish_access BOOLEAN DEFAULT false;
