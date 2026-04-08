-- Renombrar Alea Catfish → Alea Centurión
-- Tablas catfish_* → centurion_*
-- Columna has_catfish_access → has_centurion_access

-- Renombrar tablas
ALTER TABLE catfish_profiles RENAME TO centurion_profiles;
ALTER TABLE catfish_scrape_jobs RENAME TO centurion_scrape_jobs;

-- Renombrar índices
ALTER INDEX idx_catfish_profiles_name RENAME TO idx_centurion_profiles_name;
ALTER INDEX idx_catfish_profiles_company RENAME TO idx_centurion_profiles_company;
ALTER INDEX idx_catfish_profiles_email RENAME TO idx_centurion_profiles_email;
ALTER INDEX idx_catfish_profiles_scrape_status RENAME TO idx_centurion_profiles_scrape_status;
ALTER INDEX idx_catfish_profiles_assigned RENAME TO idx_centurion_profiles_assigned;
ALTER INDEX idx_catfish_profiles_created_by RENAME TO idx_centurion_profiles_created_by;
ALTER INDEX idx_catfish_scrape_jobs_profile RENAME TO idx_centurion_scrape_jobs_profile;
ALTER INDEX idx_catfish_scrape_jobs_status RENAME TO idx_centurion_scrape_jobs_status;

-- Renombrar trigger
ALTER TRIGGER catfish_profiles_updated_at ON centurion_profiles RENAME TO centurion_profiles_updated_at;

-- Renombrar función
ALTER FUNCTION update_catfish_updated_at RENAME TO update_centurion_updated_at;

-- Renombrar columna has_catfish_access → has_centurion_access
ALTER TABLE agents RENAME COLUMN has_catfish_access TO has_centurion_access;

-- Actualizar RLS policies
DROP POLICY IF EXISTS "Agents can view assigned catfish profiles" ON centurion_profiles;
DROP POLICY IF EXISTS "Agents can insert catfish profiles" ON centurion_profiles;
DROP POLICY IF EXISTS "Agents can update catfish profiles" ON centurion_profiles;
DROP POLICY IF EXISTS "Service role full access catfish" ON centurion_profiles;

CREATE POLICY "Agents can view assigned centurion profiles"
ON centurion_profiles FOR SELECT
TO authenticated
USING (
    assigned_agent_id IN (SELECT id FROM agents WHERE id = auth.uid() AND is_approved = true)
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND has_centurion_access = true)
);

CREATE POLICY "Agents can insert centurion profiles"
ON centurion_profiles FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND is_approved = true)
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND has_centurion_access = true)
);

CREATE POLICY "Agents can update centurion profiles"
ON centurion_profiles FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR assigned_agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND has_centurion_access = true)
);

CREATE POLICY "Service role full access centurion"
ON centurion_profiles FOR ALL
TO service_role
USING (true);

-- Agregar has_centurion_access si no existe (para agentes que no tienen la columna)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS has_centurion_access BOOLEAN DEFAULT false;

-- Dar acceso a beenocode@gmail.com
UPDATE agents SET has_centurion_access = true WHERE email = 'beenocode@gmail.com';
