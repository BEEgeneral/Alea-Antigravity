-- Standardize RLS policy naming conventions
-- Run this in Supabase SQL Editor

-- Drop existing policies with inconsistent names
DROP POLICY IF EXISTS "Authenticated users can view published properties" ON properties;
DROP POLICY IF EXISTS "Agents can manage properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON leads;
DROP POLICY IF EXISTS "Allow inserts for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Allow select for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON iai_inbox_suggestions;
DROP POLICY IF EXISTS "Authenticated users can view all investors" ON investors;
DROP POLICY IF EXISTS "Agents can manage investors" ON investors;
DROP POLICY IF EXISTS "Authenticated users can view all collaborators" ON collaborators;
DROP POLICY IF EXISTS "Allow collaborators to update own profile" ON collaborators;

-- Recreate with standardized naming: "[Table]_[Operation]_[For/By]_[Target]"
-- Properties
CREATE POLICY "properties_select_published" ON properties FOR SELECT TO authenticated USING (is_published = true OR is_off_market = true);
CREATE POLICY "properties_insert_agent" ON properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "properties_update_agent" ON properties FOR UPDATE TO authenticated USING (true);
CREATE POLICY "properties_delete_agent" ON properties FOR DELETE TO authenticated USING (false);

-- Leads
CREATE POLICY "leads_select_authenticated" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert_authenticated" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update_authenticated" ON leads FOR UPDATE TO authenticated USING (true);

-- Investors
CREATE POLICY "investors_select_authenticated" ON investors FOR SELECT TO authenticated USING (true);
CREATE POLICY "investors_insert_agent" ON investors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "investors_update_agent" ON investors FOR UPDATE TO authenticated USING (true);

-- Collaborators
CREATE POLICY "collaborators_select_authenticated" ON collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "collaborators_insert_authenticated" ON collaborators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "collaborators_update_own" ON collaborators FOR UPDATE TO authenticated USING (true);

-- Mandatarios
CREATE POLICY "mandatarios_select_authenticated" ON mandatarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "mandatarios_insert_agent" ON mandatarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mandatarios_update_agent" ON mandatarios FOR UPDATE TO authenticated USING (true);

-- Agents
CREATE POLICY "agents_select_authenticated" ON agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents_insert_admin" ON agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agents_update_admin" ON agents FOR UPDATE TO authenticated USING (true);
