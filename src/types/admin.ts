// ─────────────────────────────────────────────────────────
// Aleasignature — Admin Domain Types
// Single source of truth for all admin-related interfaces.
// Derived from Supabase schema usage across the codebase.
// ─────────────────────────────────────────────────────────

export interface Agent {
    id: string;
    full_name: string;
    email: string;
    role: "admin" | "agent";
    is_approved: boolean;
    created_at?: string;
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
}

export interface Property {
    id: string;
    title: string;
    address: string;
    price: number;
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
    // Financial Details
    monthly_rent?: number;
    community_fee?: number;
    insurance?: number;
    maintenance?: number;
    ibi_tax?: number;
    // Features
    features?: string[];
    year_built?: number;
    floor?: string;
    orientation?: string;
    energy_rating?: string;
}

export interface Lead {
    id: string;
    status: string;
    match_score?: number;
    created_at?: string;
    updated_at?: string;
    // Inline fields (from legacy mock data)
    investor?: string;
    property?: string;
    type?: string;
    ticket?: string;
    email?: string;
    agent?: string;
    matchScore?: number;
    // Joined Supabase relations
    investors?: Investor;
    properties?: Property;
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
}

export interface DocumentTemplate {
    id: string;
    name: string;
}

export type AdminTab = "crm" | "investors" | "templates" | "assets" | "audit" | "agents";

export interface InvestorFormData {
    full_name: string;
    company_name: string;
    email: string;
    phone: string;
    investor_type: string;
    min_ticket_eur: number;
    max_ticket_eur: number;
}

export interface AgentFormData {
    full_name: string;
    email: string;
    role: string;
}

// Pipeline stage definition
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

// Mock data
export const MOCK_ACTIVITY: ActivityLog[] = [
    { id: "a1", action: "DOWNLOADED_DOCUMENT", detail: "Alberto Gala downloaded 'Nota Simple - Palacio Gran Vía'", time: "10 mins ago" },
    { id: "a2", action: "LEAD_UPDATED", detail: "Lead 'Familia Ortiz' moved to Due Diligence", time: "1 hour ago" },
    { id: "a3", action: "NEW_INVESTOR", detail: "New KYC submitted by 'Capital Ibérico S.L.'", time: "3 hours ago" },
];

export const MOCK_TEMPLATES: DocumentTemplate[] = [
    { id: "t1", name: "NDA Premium" },
    { id: "t2", name: "Informe de Valoración" },
    { id: "t3", name: "Carta de Mandato" },
    { id: "t4", name: "Due Diligence Checklist" },
];
