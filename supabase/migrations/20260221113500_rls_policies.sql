-- Aleasignature - Row Level Security (RLS) Policies

-- Habilitar RLS en todas las tablas
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 1. PROPERTIES POLICIES
-------------------------------------------------------------------------------
-- PUBLICO: Puede ver propiedades publicadas que no sean off-market.
CREATE POLICY "Public can view published and non-off-market properties"
ON properties FOR SELECT
USING (is_published = true AND is_off_market = false);

-- AUTHENTICATED (Cualquier inversor registrado): Puede ver listado completo.
-- Nota: En frontend, si es_off_market, la tarjeta tendra blur si el leads_pipeline no es 'nda_signed' o mas.
CREATE POLICY "Authenticated users can view published properties"
ON properties FOR SELECT
TO authenticated
USING (is_published = true);

-- INTERNAL ROLE / ADMIN (Para Supabase Dashboards): All Access
CREATE POLICY "Service Role All Access Properties"
ON properties USING (auth.role() = 'service_role');


-------------------------------------------------------------------------------
-- 2. INVESTORS POLICIES
-------------------------------------------------------------------------------
-- SOLO LECTURA a si mismo
CREATE POLICY "Individuals can view their own investor profile"
ON investors FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ACTUALIZACION a si mismo
CREATE POLICY "Individuals can update their own investor profile"
ON investors FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- INTERNAL ROLE / ADMIN
CREATE POLICY "Service Role All Access Investors"
ON investors USING (auth.role() = 'service_role');


-------------------------------------------------------------------------------
-- 3. LEADS PIPELINE POLICIES
-------------------------------------------------------------------------------
-- Usuarios pueden ver en que pipeline estan
CREATE POLICY "Investors can view their own pipeline statuses"
ON leads_pipeline FOR SELECT
TO authenticated
USING (investor_id = auth.uid());


-------------------------------------------------------------------------------
-- 4. DOCUMENTS POLICIES (Data Room Segura) 
-------------------------------------------------------------------------------
-- Validacion compleja: ¿El usuario actual tiene acceso al documento?
-- Si no requiere NDA (general) o el usuario tiene el NDA firmado (pipeline >= 'nda_signed' o 'data_room')
CREATE POLICY "Investors can access documents if verified or no NDA required"
ON documents FOR SELECT
TO authenticated
USING (
    requires_nda = false OR
    EXISTS (
        SELECT 1 FROM leads_pipeline
        WHERE leads_pipeline.property_id = documents.property_id
        AND leads_pipeline.investor_id = auth.uid()
        AND leads_pipeline.status IN ('nda_signed', 'data_room', 'closed')
    )
);


-------------------------------------------------------------------------------
-- 5. ACTIVITY LOGS POLICIES
-------------------------------------------------------------------------------
-- El usuario solo puede insertar logs suyos (pero leerlos es solo para admin/service_role)
CREATE POLICY "Users can insert their own logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Service Role All Access Logs"
ON activity_logs USING (auth.role() = 'service_role');
