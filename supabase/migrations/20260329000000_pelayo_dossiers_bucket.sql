-- Create dossiers storage bucket for PDF/images uploaded to Pelayo
-- Run this in Supabase SQL Editor

-- Create the dossiers bucket (public bucket for storing dossier images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'dossiers',
    'dossiers',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

-- Create storage policy for authenticated users to upload dossiers
CREATE POLICY "Authenticated users can upload dossiers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'dossiers'
);

-- Create storage policy for authenticated users to read dossiers
CREATE POLICY "Authenticated users can read dossiers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'dossiers'
);

-- Create storage policy for authenticated users to update dossiers
CREATE POLICY "Authenticated users can update dossiers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'dossiers'
);

-- Create storage policy for authenticated users to delete dossiers
CREATE POLICY "Authenticated users can delete dossiers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'dossiers'
);

-- Create table to track dossier uploads and their associations
CREATE TABLE IF NOT EXISTS pelayo_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    extracted_text TEXT,
    associated_entity_type TEXT, -- 'property', 'investor', etc.
    associated_entity_id UUID,
    page_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on pelayo_dossiers
ALTER TABLE pelayo_dossiers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own dossiers
CREATE POLICY "Users can view own dossiers"
ON pelayo_dossiers
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Policy: Users can insert their own dossiers
CREATE POLICY "Users can insert own dossiers"
ON pelayo_dossiers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Policy: Users can update their own dossiers
CREATE POLICY "Users can update own dossiers"
ON pelayo_dossiers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);