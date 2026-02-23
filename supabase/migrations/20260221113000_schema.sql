-- Aleasignature - Core Schema
-- Ejecutar en Supabase SQL Editor o guardar como migracion de Supabase CLI

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE asset_class AS ENUM ('hotel', 'building', 'villa');
CREATE TYPE pipeline_status AS ENUM ('prospect', 'nda_signed', 'data_room', 'closed');
CREATE TYPE source_of_funds AS ENUM ('family_office', 'private_equity', 'hnwi', 'institutional');

-- 3. TABLES

-- Properties (Activos)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type asset_class NOT NULL,
    location VARCHAR(255) NOT NULL,
    price_eur DECIMAL(15,2) NOT NULL,
    cap_rate DECIMAL(5,2), -- e.g., 5.50
    m2_total INTEGER,
    is_off_market BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Investors (Inversores)
CREATE TABLE investors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    is_verified BOOLEAN DEFAULT false, -- True cuando firman NDA general y pasan KYC
    source_of_funds source_of_funds,
    target_locations TEXT[], -- Array de ubicaciones de interes (e.g. ['Málaga', 'Madrid'])
    target_asset_types asset_class[], -- Intereses (e.g. ['hotel'])
    min_ticket_eur DECIMAL(15,2),
    max_ticket_eur DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Leads Pipeline (Relacion Inversor <-> Activo)
CREATE TABLE leads_pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
    status pipeline_status DEFAULT 'prospect',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(property_id, investor_id)
);

-- Documents (Archivos de la Data Room)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Path en Supabase Storage
    document_type VARCHAR(100), -- ej. 'Catastro', 'Nota Simple', 'Planos'
    requires_nda BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activity Logs (Auditoria)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- ej. 'VIEWED_PROPERTY', 'DOWNLOADED_DOCUMENT'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_modtime
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_leads_pipeline_modtime
    BEFORE UPDATE ON leads_pipeline
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
