-- Fix Properties RLS and Asset Type Enum
-- This migration adds necessary RLS policies for agents and expands the asset_class enum

-- 1. Expand asset_class enum
-- We need to add more types as seen in the frontend: Hotel, Edificio, Suelo, Retail, Oficinas, Logístico, Otro
-- Note: Postgres doesn't allow adding values to enums inside a transaction easily in some versions,
-- but for Supabase it usually works with ALTER TYPE.

-- First check existing values and add only missing ones
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'asset_class' AND e.enumlabel = 'office') THEN
        ALTER TYPE asset_class ADD VALUE 'office';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'asset_class' AND e.enumlabel = 'retail') THEN
        ALTER TYPE asset_class ADD VALUE 'retail';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'asset_class' AND e.enumlabel = 'land') THEN
        ALTER TYPE asset_class ADD VALUE 'land';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'asset_class' AND e.enumlabel = 'industrial') THEN
        ALTER TYPE asset_class ADD VALUE 'industrial';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'asset_class' AND e.enumlabel = 'other') THEN
        ALTER TYPE asset_class ADD VALUE 'other';
    END IF;
END
$$;

-- 2. Add missing RLS policies for agents on properties table
-- Approved agents should be able to manage properties

CREATE POLICY "Approved agents can insert properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (is_approved_agent());

CREATE POLICY "Approved agents can update properties"
ON public.properties FOR UPDATE
TO authenticated
USING (is_approved_agent())
WITH CHECK (is_approved_agent());

CREATE POLICY "Approved agents can delete properties"
ON public.properties FOR DELETE
TO authenticated
USING (is_approved_agent());
