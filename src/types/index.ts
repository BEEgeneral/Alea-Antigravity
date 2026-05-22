// ─────────────────────────────────────────────────────────
// Alea Signature — Shared Types
// Central repository for all cross-domain TypeScript interfaces.
// ─────────────────────────────────────────────────────────

export * from './admin';

// ─────────────────────────────────────────────────────────
// Auth & Session Types
// ─────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'agent' | 'viewer';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  is_active?: boolean;
  is_approved?: boolean;
  has_centurion_access?: boolean;
  created_at?: string;
  full_name?: string;
}

export interface Session {
  id: string;
  user: User;
  expires_at?: string;
  created_at?: string;
}

export interface AuthToken {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_approved: boolean;
}

// ─────────────────────────────────────────────────────────
// Chat & AI Types
// ─────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface AIMessage extends ChatMessage {
  streaming?: boolean;
  feedback?: FeedbackRating | null;
}

export type FeedbackRating = 'thumbs_up' | 'thumbs_down';

// Hermes streaming events from /api/hermes/chat
export type HermesEventType = 'content' | 'tool_calls' | 'tool_result' | 'done' | 'error';

export interface HermesStreamContentEvent {
  type: 'content';
  content: string;
}

export interface HermesStreamToolCallsEvent {
  type: 'tool_calls';
  tools: ToolCall[];
}

export interface HermesStreamToolResultEvent {
  type: 'tool_result';
  toolCallId: string;
  toolName: string;
  result: string;
}

export interface HermesStreamDoneEvent {
  type: 'done';
}

export interface HermesStreamErrorEvent {
  type: 'error';
  error: string;
}

export type HermesStreamEvent =
  | HermesStreamContentEvent
  | HermesStreamToolCallsEvent
  | HermesStreamToolResultEvent
  | HermesStreamDoneEvent
  | HermesStreamErrorEvent;

// Tool calling
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  output: string;
}

// Voice configuration
export interface VoiceConfig {
  enabled: boolean;
  voiceId?: string;
}

// ─────────────────────────────────────────────────────────
// Piedras Preciosas Classification
// ─────────────────────────────────────────────────────────

export type piedraPreciosa = 
  | 'diamante' 
  | 'rubi' 
  | 'esmeralda' 
  | 'zafiro' 
  | 'topacio' 
  | 'amatista';

export interface PiedraPreciosaInfo {
  name: piedraPreciosa;
  display_name: string;
  color: string;
  description: string;
  approach_tips: string[];
  communication_style: string;
}

export const PIEDRAS_PRECIOSAS: Record<piedraPreciosa, PiedraPreciosaInfo> = {
  diamante: {
    name: 'diamante',
    display_name: 'Diamante',
    color: '#B9F2FF',
    description: 'Inversores de ultra alta gama. Tickets >5M€. Buscan exclusividad total.',
    approach_tips: ['Acceso VIP', 'Propiedades exclusivas off-market', 'Servicio white-glove'],
    communication_style: 'Formal, exclusivo, personalizado'
  },
  rubi: {
    name: 'rubi',
    display_name: 'Rubí',
    color: '#FF4D4D',
    description: 'Inversores high-net-worth. Tickets 1-5M€. Valoran calidad.',
    approach_tips: ['Presentaciones premium', 'Datos detallados', 'Análisis de oportunidad'],
    communication_style: 'Profesional, detallado, orientado a datos'
  },
  esmeralda: {
    name: 'esmeralda',
    display_name: 'Esmeralda',
    color: '#4DFF88',
    description: 'Inversores de gama media-alta. Tickets 500K-1M€. Buscan estabilidad.',
    approach_tips: ['Análisis de riesgo/recompensa', 'Proyecciones realistas', 'Casos de éxito'],
    communication_style: 'Equilibrado, preventivo, consultivo'
  },
  zafiro: {
    name: 'zafiro',
    display_name: 'Zafiro',
    color: '#4D8FFF',
    description: 'Inversores institucionales o familiares. Proceso formal.',
    approach_tips: ['Documentación completa', 'Compliance', 'Due diligence riguroso'],
    communication_style: 'Formal, documentado, estructurado'
  },
  topacio: {
    name: 'topacio',
    display_name: 'Topacio',
    color: '#FFD94D',
    description: 'Inversores profesionales. Tickets 200-500K€. Decisiones rápidas.',
    approach_tips: ['Eficiencia', 'Resumenes ejecutivos', 'Números claros'],
    communication_style: 'Directo, eficiente, orientado a resultados'
  },
  amatista: {
    name: 'amatista',
    display_name: 'Amatista',
    color: '#B266FF',
    description: 'Inversores conservadores o noveles. Tickets <200K€.',
    approach_tips: ['Educación', 'Seguridad', 'Guías paso a paso'],
    communication_style: 'Paciente, educativo, tranquilizador'
  }
};

// ─────────────────────────────────────────────────────────
// DISC Classification
// ─────────────────────────────────────────────────────────

export type DISCType = 'D' | 'I' | 'S' | 'C';

export interface DISCInfo {
  type: DISCType;
  name: string;
  color: string;
  traits: string[];
  ideal_approach: string;
  communication_tips: string[];
}

export const TARGET_DISC: Record<DISCType, DISCInfo> = {
  D: {
    type: 'D',
    name: 'Dominante',
    color: '#FF6B6B',
    traits: ['Decisivo', 'Orientado a resultados', 'Toma riesgos'],
    ideal_approach: 'Ir al grano, dar opciones, permitir autonomía',
    communication_tips: ['Ser directo', 'Enfocarse en resultados', 'Evitar rodeos']
  },
  I: {
    type: 'I',
    name: 'Influyente',
    color: '#4ECDC4',
    traits: ['Sociable', 'Entusiasta', 'Creativo'],
    ideal_approach: 'Relaciones primero, crear visión compartida',
    communication_tips: ['Ser entusiasta', 'Involucrar en decisiones', 'Usar historias']
  },
  S: {
    type: 'S',
    name: 'Estable',
    color: '#45B7D1',
    traits: ['Paciente', 'Leal', 'Metódico'],
    ideal_approach: 'Construir confianza, dar tiempo, demostrar estabilidad',
    communication_tips: ['Ser paciente', 'Proporcionar seguridad', 'Evitar presión']
  },
  C: {
    type: 'C',
    name: 'Conciente',
    color: '#96CEB4',
    traits: ['Analítico', 'Exacto', 'Perfeccionista'],
    ideal_approach: 'Datos y hechos, precisión, tiempo para evaluar',
    communication_tips: ['Ser preciso', 'Proporcionar datos', 'Evitar ambigüedad']
  }
};

// ─────────────────────────────────────────────────────────
// Investor Classification Types
// ─────────────────────────────────────────────────────────

export type InvestorType = 
  | 'individual' 
  | 'family_office' 
  | 'institutional' 
  | 'corporate' 
  | 'fund' 
  | 'reit' 
  | 'private_equity';

export type RiskProfile = 
  | 'conservative' 
  | 'moderate' 
  | 'balanced' 
  | 'opportunistic' 
  | 'aggressive';

export type TicketSize = 
  | 'micro'      // <100K
  | 'small'     // 100K-300K
  | 'medium'    // 300K-700K
  | 'large'     // 700K-2M
  | 'whale';    // >2M

// ─────────────────────────────────────────────────────────
// Property Types
// ─────────────────────────────────────────────────────────

export type PropertyType = 
  | 'residential' 
  | 'commercial' 
  | 'industrial' 
  | 'land' 
  | 'mixed_use' 
  | 'hotel' 
  | 'retail';

export type PropertyStatus = 
  | 'available' 
  | 'under_contract' 
  | 'sold' 
  | 'off_market' 
  | 'archived';

// ─────────────────────────────────────────────────────────
// Lead Types
// ─────────────────────────────────────────────────────────

export type LeadStatus = 
  | 'prospect' 
  | 'qualified' 
  | 'due_diligence' 
  | 'offer' 
  | 'closing' 
  | 'won' 
  | 'lost';

export type LeadSource = 
  | 'organic' 
  | 'referral' 
  | 'cold_outreach' 
  | 'radar' 
  | 'partner' 
  | 'event' 
  | 'ia_intelligence';

// ─────────────────────────────────────────────────────────
// Radar & Signal Types
// ─────────────────────────────────────────────────────────

export type SignalSource = 
  | 'boe' 
  | 'concursos' 
  | 'boletin_urbanistico' 
  | 'network' 
  | 'architect' 
  | 'international';

export type SignalStatus = 
  | 'detected' 
  | 'analyzing' 
  | 'qualified' 
  | 'matched' 
  | 'closed' 
  | 'archived';

// ─────────────────────────────────────────────────────────
// NDA & Document Types
// ─────────────────────────────────────────────────────────

export type NDAStatus = 
  | 'pending' 
  | 'sent' 
  | 'signed' 
  | 'expired' 
  | 'revoked';

export interface NDADocument {
  id: string;
  investor_id: string;
  property_id: string;
  status: NDAStatus;
  signed_at?: string;
  expires_at?: string;
  document_url?: string;
}

// ─────────────────────────────────────────────────────────
// Commission Types
// ─────────────────────────────────────────────────────────

export interface CommissionBreakdown {
  base_commission: number;
  agency_fee: number;
  agent_commission: number;
  override_commission: number;
  total: number;
}

export interface CommissionTier {
  min_price: number;
  max_price: number;
  agent_rate: number;
  override_rate: number;
}

// ─────────────────────────────────────────────────────────
// Memory & Knowledge Types
// ─────────────────────────────────────────────────────────

export interface MemoryRoom {
  id: string;
  investor_id?: string;
  room_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MemoryDrawer {
  id: string;
  room_id: string;
  drawer_key: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────
// Telemetry Types
// ─────────────────────────────────────────────────────────

export interface TelemetryEvent {
  id?: string;
  event_type: string;
  timestamp: string;
  user_id?: string;
  session_id?: string;
  rating?: FeedbackRating;
  messageId?: string;
  feedback_text?: string;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ─────────────────────────────────────────────────────────
// Form Types
// ─────────────────────────────────────────────────────────

export interface InvestorFormData {
  full_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  investor_type?: InvestorType;
  piedra?: piedraPreciosa;
  disc?: DISCType;
  risk_profile?: RiskProfile;
  min_ticket_eur?: number;
  max_ticket_eur?: number;
  interests?: string[];
  labels?: string[];
}

export interface PropertyFormData {
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  meters: number;
  address: string;
  vendor_name: string;
  rooms?: number;
  bathrooms?: number;
  year_built?: number;
  energy_rating?: string;
}

export interface LeadFormData {
  investor_id?: string;
  property_id?: string;
  source?: LeadSource;
  status?: LeadStatus;
  notes?: string;
}