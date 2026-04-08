-- Alea Agenda - Sistema de Acciones y Recordatorios
-- Vinculado al CRM para seguimiento de operativa

-- Tabla principal de acciones
CREATE TABLE IF NOT EXISTS agenda_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculación CRM
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    
    -- Datos de la acción
    title VARCHAR(500) NOT NULL,
    description TEXT,
    action_type VARCHAR(100) NOT NULL, -- 'call', 'email', 'meeting', 'document', 'follow_up', 'kyc', 'nda', 'loi', 'offer', 'closing', 'custom'
    action_category VARCHAR(100), -- 'contact', 'documentation', 'legal', 'financial', 'negotiation', 'closing'
    
    -- Scheduling
    due_date TIMESTAMPTZ NOT NULL,
    scheduled_for TIMESTAMPTZ, -- Fecha/hora específica de ejecución
    estimated_duration_minutes INTEGER DEFAULT 30,
    
    -- Prioridad y estado
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'failed', 'waiting')),
    
    -- Resultado
    outcome TEXT, -- Resultado de la acción
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES agents(id),
    
    -- Automatización
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern JSONB, -- {"frequency": "weekly", "interval": 1, "end_date": "..."}
    is_auto_generated BOOLEAN DEFAULT false, -- Si fue creada automáticamente por el sistema
    trigger_rule VARCHAR(100), -- Regla que provocó la creación automática
    
    -- Tracking de timing vs SLA
    sla_hours INTEGER, -- Horas SLA esperadas para esta acción
    sla_breached BOOLEAN DEFAULT false,
    sla_breach_notified BOOLEAN DEFAULT false,
    
    -- Relacion con pipeline
    pipeline_stage VARCHAR(100), -- Etapa del pipeline cuando se creó
    
    -- Access control
    assigned_agent_id UUID REFERENCES agents(id),
    created_by UUID REFERENCES agents(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para agenda_actions
CREATE INDEX IF NOT EXISTS idx_agenda_actions_lead ON agenda_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_agenda_actions_assigned ON agenda_actions(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agenda_actions_due ON agenda_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_agenda_actions_status ON agenda_actions(status);
CREATE INDEX IF NOT EXISTS idx_agenda_actions_pipeline ON agenda_actions(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_agenda_actions_type ON agenda_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_agenda_actions_priority ON agenda_actions(priority);

-- Tabla de recordatorios automáticos
CREATE TABLE IF NOT EXISTS agenda_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculación
    action_id UUID REFERENCES agenda_actions(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Datos del reminder
    reminder_type VARCHAR(50) DEFAULT 'notification' CHECK (reminder_type IN ('notification', 'sla_warning', 'sla_breach', 'follow_up', 'escalation', 'suggestion')),
    title VARCHAR(500) NOT NULL,
    message TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'dismissed', 'failed')),
    channel VARCHAR(50) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'pelayo_chat')),
    
    -- Prioridad
    priority VARCHAR(50) DEFAULT 'medium',
    
    -- Agente al que va dirigido
    assigned_agent_id UUID REFERENCES agents(id),
    
    -- Metadata
    metadata JSONB, -- Datos adicionales para renderizado en UI
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_reminders_action ON agenda_reminders(action_id);
CREATE INDEX IF NOT EXISTS idx_agenda_reminders_lead ON agenda_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_agenda_reminders_agent ON agenda_reminders(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agenda_reminders_scheduled ON agenda_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_agenda_reminders_status ON agenda_reminders(status);

-- Tabla de templates de acciones por etapa del pipeline
CREATE TABLE IF NOT EXISTS pipeline_action_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template base
    name VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(100) NOT NULL,
    action_category VARCHAR(100),
    title_template VARCHAR(500), -- Template con placeholders: {{lead_name}}, {{property_title}}
    description_template TEXT,
    
    -- Configuración de timing
    default_sla_hours INTEGER DEFAULT 72, -- 3 días por defecto
    min_sla_hours INTEGER DEFAULT 24,
    max_sla_hours INTEGER DEFAULT 168, -- 7 días máximo
    
    -- Cuándo crear
    trigger_at_stage VARCHAR(100), -- Etapa en que se activa ('prospect', 'qualified', etc.)
    trigger_event VARCHAR(100), -- 'stage_entry', 'stage_exit', 'manual', 'sla_breach', 'time_based'
    
    -- Auto-creación
    auto_create BOOLEAN DEFAULT false, -- Si se crea automáticamente al entrar en etapa
    auto_assign_to VARCHAR(100) DEFAULT 'owner', -- 'owner', 'assigned_agent', 'admin'
    
    -- Prioridad por defecto
    default_priority VARCHAR(50) DEFAULT 'medium',
    
    -- ¿Activo?
    is_active BOOLEAN DEFAULT true,
    
    -- Orden en que debe aparecer
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates por defecto para cada etapa
-- LOI = Letter of Intent (Carta de Intenciones) - Documento clave en operaciones inmobiliarias
INSERT INTO pipeline_action_templates (name, action_type, action_category, title_template, description_template, default_sla_hours, trigger_at_stage, trigger_event, auto_create, display_order) VALUES
-- PROSPECT
('Contactar lead inicial', 'call', 'contact', 'Llamada de contacto con {{lead_name}}', 'Primera llamada de contacto para qualifier al lead', 24, 'prospect', 'stage_entry', true, 1),
('Enviar presentación Alea', 'email', 'contact', 'Enviar presentación Alea a {{lead_name}}', 'Enviar materials de presentación de la plataforma', 48, 'prospect', 'stage_entry', true, 2),
('Registrar interés inicial', 'follow_up', 'contact', 'Documentar interés de {{lead_name}}', 'Registrar qué propiedades le interesan y su perfil', 24, 'prospect', 'stage_entry', true, 3),

-- QUALIFIED
('Enviar NDA', 'document', 'legal', 'Enviar NDA a {{lead_name}}', 'Preparar y enviar NDA para protección de datos off-market', 48, 'qualified', 'stage_entry', true, 1),
('Solicitar KYC', 'kyc', 'documentation', 'Solicitar documentación KYC', 'Enviar checklist de documentación KYC requerida', 72, 'qualified', 'stage_entry', true, 2),
('Registrar perfil inversor', 'follow_up', 'documentation', 'Completar perfil de {{lead_name}}', 'Registrar todos los datos del inversor en el sistema', 24, 'qualified', 'stage_entry', true, 3),
('Match con propiedades', 'follow_up', 'contact', 'Presentar propiedades a {{lead_name}}', 'Enviar selección de propiedades que matchean su perfil', 48, 'qualified', 'stage_entry', true, 4),

-- DUE DILIGENCE
('Programar Visita', 'meeting', 'contact', 'Visitar propiedad con {{lead_name}}', 'Programar y confirmar visita física/virtual', 24, 'due-diligence', 'stage_entry', true, 1),
('Enviar Due Diligence', 'document', 'documentation', 'Enviar informe Due Diligence', 'Preparar y enviar dossier de due diligence', 48, 'due-diligence', 'stage_entry', true, 2),
('Verificar documentación', 'follow_up', 'documentation', 'Verificar docs KYC de {{lead_name}}', 'Revisar y validar documentación recibida', 72, 'due-diligence', 'stage_entry', true, 3),
('Valuación financiera', 'follow_up', 'financial', 'Analizar financiación de {{lead_name}}', 'Revisar capacidad financiera y opciones', 72, 'due-diligence', 'stage_entry', true, 4),

-- OFFER
('Preparar y enviar LOI', 'loi', 'legal', 'Enviar LOI (Carta de Intenciones) a {{lead_name}}', 'LOI = Letter of Intent. Documento que formaliza la intención de compra con términos pactados. Incluir precio, condiciones, calendario y depósitos.', 48, 'offer', 'stage_entry', true, 1),
('Recibir y revisar LOI firmada', 'follow_up', 'legal', 'Recibir LOI firmada de {{lead_name}}', 'Confirmar recepción de LOI firmada y verificar que todos los términos son correctos', 24, 'offer', 'stage_entry', true, 2),
('Depositar garantía', 'follow_up', 'financial', 'Confirmar depósito de garantía', 'Verificar recepción del depósito de garantía (typically 3-10% del precio de compra)', 48, 'offer', 'stage_entry', true, 3),
('Revisar oferta con jurídico', 'follow_up', 'legal', 'Revisión jurídica de oferta', 'Coordinar con equipo jurídico la revisión de términos', 24, 'offer', 'stage_entry', true, 4),
('Enviar carta de mandato', 'document', 'legal', 'Enviar carta de mandato', 'Preparar y enviar carta de mandato exclusivo', 72, 'offer', 'stage_entry', true, 5),

-- CLOSING
('Programar closing', 'meeting', 'closing', 'Programar fecha de closing', 'Coordinar fecha y lugar de closing', 48, 'closing', 'stage_entry', true, 1),
('Enviar documentación final', 'document', 'legal', 'Enviar docs finales', 'Enviar todos los documentos para firma (escritura,掖ransferencia, etc.)', 24, 'closing', 'stage_entry', true, 2),
('Confirmar transferencia', 'follow_up', 'financial', 'Confirmar transferencia', 'Verificar recepción de fondos restantes', 24, 'closing', 'stage_entry', true, 3),
('Cierre de operativa', 'follow_up', 'closing', 'Cerrar operativa', 'Registro final, feedback del cliente y documentación de cierre', 48, 'closing', 'stage_entry', true, 4);

-- Tabla de configuración de timing por etapa
CREATE TABLE IF NOT EXISTS agenda_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuración general
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    
    -- Ámbito
    scope VARCHAR(50) DEFAULT 'global' CHECK (scope IN ('global', 'pipeline_stage', 'action_type', 'agent')),
    scope_id UUID, -- ID del agente o etapa si aplica
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración por defecto
INSERT INTO agenda_settings (config_key, config_value, description, scope) VALUES
('sla_defaults', 
 '{"prospect": 72, "qualified": 96, "due-diligence": 120, "offer": 72, "closing": 48}', 
 'SLA por defecto en horas para cada etapa del pipeline', 'global'),
 
('reminder_timing', 
 '{"before_sla": [24, 48], "on_sla_breach": true, "daily_digest": true}', 
 'Configuración de recordatorios: horas antes del SLA y cuando se rompe', 'global'),
 
('auto_actions', 
 '{"enabled": true, "on_stage_change": true, "suggestions": true}', 
 'Configuración de acciones automáticas y sugerencias', 'global');

-- Tabla de log de interacciones de Agenda (para auditoría)
CREATE TABLE IF NOT EXISTS agenda_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    action_id UUID REFERENCES agenda_actions(id) ON DELETE SET NULL,
    reminder_id UUID REFERENCES agenda_reminders(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    activity_type VARCHAR(100) NOT NULL, -- 'created', 'updated', 'completed', 'cancelled', 'reminder_sent', 'sla_breach', 'sla_warning'
    description TEXT,
    
    agent_id UUID REFERENCES agents(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_activity_action ON agenda_activity_log(action_id);
CREATE INDEX IF NOT EXISTS idx_agenda_activity_lead ON agenda_activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_agenda_activity_agent ON agenda_activity_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_agenda_activity_type ON agenda_activity_log(activity_type);

-- Trigger para updated_at en agenda_actions
CREATE OR REPLACE FUNCTION update_agenda_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agenda_actions_updated_at
    BEFORE UPDATE ON agenda_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_agenda_actions_updated_at();

-- Función para calcular SLA breach
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND NEW.due_date < NOW() AND NEW.sla_hours IS NOT NULL THEN
        NEW.sla_breached = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agenda_actions_sla_check
    BEFORE INSERT OR UPDATE ON agenda_actions
    FOR EACH ROW
    EXECUTE FUNCTION check_sla_breach();

-- Agregar columnas de tracking a leads para operativo
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_action_id UUID REFERENCES agenda_actions(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS operativo_stage VARCHAR(100) DEFAULT 'prospect';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_due TIMESTAMPTZ;

-- RLS para agenda_actions
ALTER TABLE agenda_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage assigned actions"
ON agenda_actions FOR ALL
TO authenticated
USING (
    assigned_agent_id IN (SELECT id FROM agents WHERE id = auth.uid() AND is_approved = true)
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Service role full access agenda"
ON agenda_actions FOR ALL
TO service_role
USING (true);

-- RLS para agenda_reminders
ALTER TABLE agenda_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own reminders"
ON agenda_reminders FOR SELECT
TO authenticated
USING (
    assigned_agent_id IN (SELECT id FROM agents WHERE id = auth.uid() AND is_approved = true)
    OR assigned_agent_id IS NULL
);

CREATE POLICY "Service role manage reminders"
ON agenda_reminders FOR ALL
TO service_role
USING (true);

-- RLS para pipeline_action_templates
ALTER TABLE pipeline_action_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated agents view templates"
ON pipeline_action_templates FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins manage templates"
ON pipeline_action_templates FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin'));

-- RLS para agenda_settings
ALTER TABLE agenda_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view settings"
ON agenda_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage settings"
ON agenda_settings FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin'));
