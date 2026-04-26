// ─────────────────────────────────────────────────────────
// Aleasignature — Admin Domain Types
// Single source of truth for all admin-related interfaces.
// Derived from Supabase schema usage across the codebase.
// ─────────────────────────────────────────────────────────

export interface Agent {
    id: string;
    full_name: string;
    email: string;
    role: "admin" | "agent" | string;
    is_approved?: boolean;
    created_at?: string;
    has_centurion_access?: boolean;
    [key: string]: any;
}

export interface Investor {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    investor_type?: string;
    ticket_size?: string;
    min_ticket_eur?: number;
    max_ticket_eur?: number;
    is_verified?: boolean;
    kyc_status?: string;
    status?: string;
    interests?: string[];
    created_at?: string;
    investor?: string;
    budget_min?: number;
    budget_max?: number;
    labels?: string[];
    [key: string]: any;
}

export interface Property {
    id: string;
    title: string;
    address?: string;
    price?: number;
    type?: string;
    status?: string;
    description?: string;
    meters?: number;
    rooms?: number;
    bathrooms?: number;
    cap_rate?: number;
    is_off_market?: boolean;
    images?: string[];
    image?: string;
    thumbnail_url?: string;
    created_at?: string;
    monthly_rent?: number;
    community_fee?: number;
    insurance?: number;
    maintenance?: number;
    ibi_tax?: number;
    features?: string[];
    year_built?: number;
    floor?: string;
    orientation?: string;
    energy_rating?: string;
    vendor_name?: string;
    [key: string]: any;
}

export interface Lead {
    id: string;
    status: string;
    match_score?: number;
    created_at?: string;
    updated_at?: string;
    investor?: string;
    property?: string;
    property_id?: string;
    type?: string;
    ticket?: string;
    email?: string;
    agent?: string;
    matchScore?: number;
    investors?: Investor;
    properties?: Property;
    [key: string]: any;
}

export interface Interaction {
    id: string;
    leadId: string;
    type: string;
    content: string;
    date: string;
}

export interface ActivityLog {
    id: string;
    action: string;
    detail: string;
    time: string;
    user_id?: string;
    metadata?: Record<string, any>;
}

export const MOCK_ACTIVITY: ActivityLog[] = [
    { id: "a1", action: "DOWNLOADED_DOCUMENT", detail: "Alberto Gala downloaded 'Nota Simple - Palacio Gran Vía'", time: "10 mins ago" },
    { id: "a2", action: "LEAD_UPDATED", detail: "Lead 'Familia Ortiz' moved to Due Diligence", time: "1 hour ago" },
    { id: "a3", action: "NEW_INVESTOR", detail: "New KYC submitted by 'Capital Ibérico S.L.'", time: "3 hours ago" },
];

export interface Mandatario {
    id?: string;
    full_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    labels?: string[];
    propietario_type?: string;
    Mandatario_type?: string;
    created_at?: string;
    [key: string]: any;
}

export interface Collaborator {
    id?: string;
    full_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    created_at?: string;
    [key: string]: any;
}

export interface IAISuggestion {
    id: string;
    suggestion_type: 'property' | 'investor' | 'lead' | 'mandatario' | 'collaborator';
    status: 'pending' | 'approved' | 'rejected';
    original_email_subject: string;
    original_email_body?: string;
    sender_email: string;
    ai_interpretation?: string;
    extracted_data?: Record<string, any>;
    created_at?: string;
}

export interface PropertyFormData {
    title: string;
    description: string;
    type: string;
    price: number;
    meters: number;
    address: string;
    vendor_name: string;
}

export interface MandatarioFormData {
    full_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    labels?: string[];
    Mandatario_type?: string;
    [key: string]: any;
}

export interface CollaboratorFormData {
    full_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    [key: string]: any;
}

export interface AgentFormData {
    full_name: string;
    email: string;
    role: string;
}

export interface PipelineStage {
    id: string;
    label: string;
    color: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
    { id: "prospect", label: "New Lead", color: "bg-blue-400" },
    { id: "qualified", label: "Qualified", color: "bg-yellow-400" },
    { id: "due-diligence", label: "Due Diligence", color: "bg-orange-400" },
    { id: "offer", label: "Offer", color: "bg-emerald-400" },
    { id: "closing", label: "Closing", color: "bg-primary" },
];

export const VALID_STAGES = new Set(PIPELINE_STAGES.map(s => s.id));

export interface DocumentTemplate {
    id: string;
    name: string;
}

export const MOCK_TEMPLATES: DocumentTemplate[] = [
    { id: "t1", name: "NDA Premium" },
    { id: "t2", name: "Informe de Valoración" },
    { id: "t3", name: "Carta de Mandato" },
    { id: "t4", name: "Due Diligence Checklist" },
];

// ─────────────────────────────────────────────────────────
// Alea Agenda Types
// ─────────────────────────────────────────────────────────

export type ActionType = 'call' | 'email' | 'meeting' | 'document' | 'follow_up' | 'kyc' | 'nda' | 'loi' | 'offer' | 'closing' | 'custom';
export type ActionCategory = 'contact' | 'documentation' | 'legal' | 'financial' | 'negotiation' | 'closing';
export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type ActionStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'waiting';
export type ReminderType = 'notification' | 'sla_warning' | 'sla_breach' | 'follow_up' | 'escalation' | 'suggestion';

export interface AgendaAction {
    id: string;
    lead_id: string;
    investor_id?: string;
    property_id?: string;
    title: string;
    description?: string;
    action_type: ActionType;
    action_category?: ActionCategory;
    due_date: string;
    scheduled_for?: string;
    estimated_duration_minutes?: number;
    priority: ActionPriority;
    status: ActionStatus;
    outcome?: string;
    completion_notes?: string;
    completed_at?: string;
    completed_by?: string;
    is_recurring: boolean;
    recurring_pattern?: Record<string, unknown>;
    is_auto_generated: boolean;
    trigger_rule?: string;
    sla_hours?: number;
    sla_breached: boolean;
    sla_breach_notified: boolean;
    pipeline_stage?: string;
    assigned_agent_id?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AgendaReminder {
    id: string;
    action_id: string;
    lead_id: string;
    reminder_type: ReminderType;
    title: string;
    message?: string;
    scheduled_for: string;
    sent_at?: string;
    read_at?: string;
    status: 'pending' | 'sent' | 'read' | 'dismissed' | 'failed';
    channel: 'in_app' | 'email' | 'sms' | 'push' | 'pelayo_chat';
    priority: ActionPriority;
    assigned_agent_id?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

export interface PipelineActionTemplate {
    id: string;
    name: string;
    description?: string;
    action_type: ActionType;
    action_category?: ActionCategory;
    title_template?: string;
    description_template?: string;
    default_sla_hours: number;
    min_sla_hours: number;
    max_sla_hours: number;
    trigger_at_stage?: string;
    trigger_event?: 'stage_entry' | 'stage_exit' | 'manual' | 'sla_breach' | 'time_based';
    auto_create: boolean;
    auto_assign_to?: 'owner' | 'assigned_agent' | 'admin';
    default_priority: ActionPriority;
    is_active: boolean;
    display_order: number;
}

export interface AgendaSettings {
    config_key: string;
    config_value: Record<string, unknown>;
    description?: string;
    scope: 'global' | 'pipeline_stage' | 'action_type' | 'agent';
    scope_id?: string;
}

export interface AgendaSuggestion {
    id: string;
    lead_id: string;
    lead_name: string;
    property_title?: string;
    action_id?: string;
    suggestion_type: 'overdue' | 'upcoming' | 'sla_warning' | 'stage_suggestion' | 'follow_up';
    title: string;
    message: string;
    priority: ActionPriority;
    days_overdue?: number;
    hours_until_due?: number;
    pipeline_stage: string;
}

// ─────────────────────────────────────────────────────────
// RADAR ALEA Types - Intelligence System
// ─────────────────────────────────────────────────────────

export type AleaScoreClassification = 'exceptional' | 'high' | 'medium' | 'low';
export type RadarPhase = 1 | 2 | 3 | 4 | 5;
export type OpportunityPriority = 'high' | 'medium' | 'low';
export type SignalSource = 'boe' | 'concursos' | 'boletin_urbanistico' | 'network' | 'architect' | 'international';

export interface AleaScore {
    value: number;
    classification: AleaScoreClassification;
    exclusivity: number;
    access: number;
    market_timing: number;
    source_quality: number;
    asset_type_score: number;
}

export interface Signal {
    id: string;
    source: SignalSource;
    asset_type: string;
    location_hint: string;
    alea_score: number;
    score_classification: AleaScoreClassification;
    status: 'detected' | 'analyzing' | 'qualified' | 'matched' | 'closed' | 'archived';
    detected_at: string;
    updated_at?: string;
    metadata?: Record<string, unknown>;
}

export interface Opportunity {
    id: string;
    property_id?: string;
    investor_id?: string;
    signal_id?: string;
    alea_score: number;
    priority: OpportunityPriority;
    status: 'active' | 'matched' | 'in_progress' | 'closing' | 'closed' | 'lost';
    match_score?: number;
    pipeline_stage?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TrendAlert {
    id: string;
    alert_type: 'financial_fatigue' | 'hybrid_asset' | 'legal_revaluation' | 'market_shift' | 'new_competition';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    affected_assets?: string[];
    is_active: boolean;
    created_at?: string;
}

export interface InvestorMatch {
    investor_id: string;
    property_id: string;
    budget_fit: 'match' | 'expandable' | 'no_match';
    type_fit: 'match' | 'partial' | 'no_match';
    location_fit: 'match' | 'partial' | 'no_match';
    overall_score: number;
    recommendations?: string[];
}

export interface RadarStats {
    signals_detected_today: number;
    signals_detected_week: number;
    high_priority_signals: number;
    active_opportunities: number;
    pipeline_value_estimate: number;
    recent_matches: number;
}
