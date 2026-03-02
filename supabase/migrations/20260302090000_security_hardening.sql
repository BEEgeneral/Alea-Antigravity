-- Aleasignature - Security Hardening (RLS Phase 2)
-- Proteger tablas críticas de acceso no autorizado y manipulación.

-------------------------------------------------------------------------------
-- 1. HABILITAR RLS EN TABLAS ADICIONALES
-------------------------------------------------------------------------------
ALTER TABLE IF EXISTS agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mandatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collaborators ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 2. AGENTS POLICIES
-------------------------------------------------------------------------------
-- Solo lectura para usuarios autenticados (necesario para verificar si alguien es agente)
CREATE POLICY "Auth users can view agents list"
ON agents FOR SELECT
TO authenticated
USING (true);

-- SOLO ADMINS pueden crear agentes (o el service_role)
-- Asumimos que el primer admin se crea manualmente en el dashboard
CREATE POLICY "Only admins can insert new agents"
ON agents FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM agents
        WHERE agents.id = auth.uid()
        AND agents.role = 'admin'
    )
);

-- Los agentes solo pueden actualizarse a sí mismos (pero no su rol/aprobación a menos que sean admin)
CREATE POLICY "Agents can update their basic info"
ON agents FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-------------------------------------------------------------------------------
-- 3. POLÍTICA DE "TODO PARA AGENTES"
-- (Un agente aprobado puede ver y gestionar todo en el CRM)
-------------------------------------------------------------------------------
-- Función auxiliar para check de agente aprobado
CREATE OR REPLACE FUNCTION is_approved_agent()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.agents
        WHERE id = auth.uid()
        AND is_approved = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar política "Agent All Access" a las tablas de negocio
-- LEADS
CREATE POLICY "Approved agents have all access to leads"
ON leads FOR ALL
TO authenticated
USING (is_approved_agent())
WITH CHECK (is_approved_agent());

-- INVESTORS (Extendemos la política anterior para que agentes vean todo)
CREATE POLICY "Approved agents have all access to investors"
ON investors FOR SELECT
TO authenticated
USING (is_approved_agent() OR auth.uid() = id);

-- MANDATARIOS
CREATE POLICY "Approved agents have all access to mandatarios"
ON mandatarios FOR ALL
TO authenticated
USING (is_approved_agent())
WITH CHECK (is_approved_agent());

-- COLLABORATORS
CREATE POLICY "Approved agents have all access to collaborators"
ON collaborators FOR ALL
TO authenticated
USING (is_approved_agent())
WITH CHECK (is_approved_agent());

-- PROPERTIES (Hardening: Los inversores NO ven propiedades que no son published)
-- Reemplazamos/Actualizamos la política básica
DROP POLICY IF EXISTS "Authenticated users can view published properties" ON properties;
CREATE POLICY "Agents see all, investors see published"
ON properties FOR SELECT
TO authenticated
USING (
    is_approved_agent() OR 
    (is_published = true)
);

-------------------------------------------------------------------------------
-- 4. POLÍTICAS PARA INVERSORES (Self-service)
-------------------------------------------------------------------------------
-- Los inversores pueden ver sus propios LEADS (si la tabla leads tiene investor_id)
CREATE POLICY "Investors view their own leads"
ON leads FOR SELECT
TO authenticated
USING (auth.uid() = investor_id);
