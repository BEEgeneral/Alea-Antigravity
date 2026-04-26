"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  FileCheck,
  Calendar,
  Users,
  Building,
  ChevronRight,
  X,
  Loader2,
  Award,
  BarChart3,
  Shield,
  Star,
} from "lucide-react";
import { insforge } from "@/lib/insforge-client";

interface Property {
  id: string;
  title: string;
  address?: string;
  price?: number;
  status?: string;
  is_off_market?: boolean;
  asset_type?: string;
  thumbnail_url?: string;
  created_at?: string;
  extended_data?: Record<string, unknown>;
}

interface Lead {
  id: string;
  property_id?: string;
  investor_id?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface AgendaAction {
  id: string;
  property_id?: string;
  status: string;
  action_type?: string;
  scheduled_for?: string;
  due_date?: string;
}

interface Interaction {
  id: string;
  lead_id?: string;
  property_id?: string;
  type: string;
  content?: string;
  date: string;
}

interface ScoredProperty extends Property {
  advancementScore: number;
  pipelineStage: number;
  interactionCount: number;
  daysSinceActivity: number;
  hasNDA: boolean;
  hasValuation: boolean;
  hasScheduledAction: boolean;
  hasMeeting: boolean;
  stageLabel: string;
}

const STAGE_SCORES: Record<string, number> = {
  prospect: 10,
  qualified: 30,
  "due-diligence": 50,
  offer: 75,
  closing: 95,
};

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospecto",
  qualified: "Cualificado",
  "due-diligence": "Due Diligence",
  offer: "Oferta / LOI",
  closing: "Cierre",
};

const TIER_CONFIG = [
  {
    key: "premium",
    label: "Premium",
    labelEs: "Oportunidades Premium",
    icon: Award,
    color: "#c5a059",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/20",
    width: "38%",
  },
  {
    key: "active",
    label: "Active",
    labelEs: "Pipeline Activo",
    icon: TrendingUp,
    color: "#c5a059",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    glowColor: "shadow-primary/20",
    width: "58%",
  },
  {
    key: "developing",
    label: "Developing",
    labelEs: "En Desarrollo",
    icon: Clock,
    color: "#737373",
    bgColor: "bg-muted/30",
    borderColor: "border-border",
    glowColor: "",
    width: "78%",
  },
  {
    key: "early",
    label: "Early Stage",
    labelEs: "Etapa Temprana",
    icon: Building,
    color: "#525252",
    bgColor: "bg-muted/10",
    borderColor: "border-border/50",
    glowColor: "",
    width: "100%",
  },
];

function calculateAdvancementScore(
  propertyId: string,
  leads: Lead[],
  interactions: Interaction[],
  agendaActions: AgendaAction[]
): {
  score: number;
  stage: number;
  interactionCount: number;
  daysSinceActivity: number;
  hasNDA: boolean;
  hasValuation: boolean;
  hasScheduledAction: boolean;
  hasMeeting: boolean;
  stageLabel: string;
} {
  const propertyLeads = leads.filter((l) => l.property_id === propertyId);
  const activeLead = propertyLeads[0];
  const stage = activeLead ? STAGE_SCORES[activeLead.status] || 10 : 10;
  const stageLabel = activeLead ? STAGE_LABELS[activeLead.status] || "Prospecto" : "Sin Lead";

  // Interactions
  const leadIds = propertyLeads.map((l) => l.id);
  const propertyInteractions = interactions.filter(
    (i) => i.lead_id && leadIds.includes(i.lead_id)
  );
  const interactionCount = propertyInteractions.length;
  const interactionScore = Math.min(interactionCount * 5, 30);

  // Recency
  const sortedInteractions = [...propertyInteractions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastInteraction = sortedInteractions[0];
  let daysSinceActivity = 999;
  let recencyScore = 0;
  if (lastInteraction) {
    daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity < 7) recencyScore = 25;
    else if (daysSinceActivity < 30) recencyScore = 15;
    else if (daysSinceActivity < 90) recencyScore = 5;
    else recencyScore = 0;
  }

  // Agenda actions
  const propertyActions = agendaActions.filter((a) => a.property_id === propertyId);
  const hasScheduledAction = propertyActions.some(
    (a) => a.status === "pending" || a.status === "scheduled"
  );
  const scheduledScore = hasScheduledAction ? 10 : 0;

  // NDA check
  const hasNDA = propertyLeads.some((l) => (l as any).nda_signed === true);

  // Valuation check
  const hasValuation = !!(
    propertyInteractions.find((i) => i.type === "valuation") ||
    propertyInteractions.find((i) => i.type?.toLowerCase().includes("valu"))
  );

  // Meeting check
  const hasMeeting = propertyInteractions.some(
    (i) =>
      i.type === "meeting" ||
      i.type === "visit" ||
      i.type === "video_call" ||
      i.type === "phone_call"
  );
  const meetingScore = hasMeeting ? 15 : 0;

  const total = stage + interactionScore + recencyScore + scheduledScore + (hasNDA ? 20 : 0) + (hasValuation ? 15 : 0) + meetingScore;

  return {
    score: Math.min(total, 120),
    stage,
    interactionCount,
    daysSinceActivity,
    hasNDA,
    hasValuation,
    hasScheduledAction,
    hasMeeting,
    stageLabel,
  };
}

function getTier(score: number): number {
  if (score >= 80) return 0; // premium
  if (score >= 55) return 1; // active
  if (score >= 30) return 2; // developing
  return 3; // early
}

export default function AssetPyramid() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [agendaActions, setAgendaActions] = useState<AgendaAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<ScoredProperty | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("insforge_token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [propsRes, leadsRes, actionsRes] = await Promise.allSettled([
        fetch("/api/admin/properties", { headers }),
        fetch("/api/admin/investors", { headers }),
        insforge.database.from("agenda_actions").select("*").limit(500),
      ]);

      let props: Property[] = [];
      if (propsRes.status === "fulfilled" && (propsRes.value as Response).ok) {
        const data = await (propsRes.value as Response).json();
        props = data.properties || data || [];
      }

      let allLeads: Lead[] = [];
      if (leadsRes.status === "fulfilled" && (leadsRes.value as Response).ok) {
        const data = await (leadsRes.value as Response).json();
        allLeads = data.leads || data || [];
      }

      let allActions: AgendaAction[] = [];
      if (actionsRes.status === "fulfilled") {
        const result = (actionsRes.value as any);
        if (result.data) allActions = result.data;
      }

      // Try interactions
      let allInteractions: Interaction[] = [];
      try {
        const intRes = await insforge.database.from("interactions").select("*").limit(500);
        if (intRes.data) allInteractions = intRes.data;
      } catch {
        // table might not exist
      }

      setProperties(props);
      setLeads(allLeads);
      setAgendaActions(allActions);
      setInteractions(allInteractions);
    } catch (err) {
      console.error("Error loading pyramid data:", err);
    } finally {
      setLoading(false);
    }
  };

  const scoredProperties = useMemo<ScoredProperty[]>(() => {
    return properties.map((p) => {
      const { score, stage, interactionCount, daysSinceActivity, hasNDA, hasValuation, hasScheduledAction, hasMeeting, stageLabel } =
        calculateAdvancementScore(p.id, leads, interactions, agendaActions);
      return {
        ...p,
        advancementScore: score,
        pipelineStage: stage,
        interactionCount,
        daysSinceActivity,
        hasNDA,
        hasValuation,
        hasScheduledAction,
        hasMeeting,
        stageLabel,
      };
    }).sort((a, b) => b.advancementScore - a.advancementScore);
  }, [properties, leads, interactions, agendaActions]);

  const tieredProperties = useMemo(() => {
    const tiers: ScoredProperty[][] = [[], [], [], []];
    scoredProperties.forEach((p) => {
      const tier = getTier(p.advancementScore);
      tiers[tier].push(p);
    });
    return tiers;
  }, [scoredProperties]);

  const tierCounts = tieredProperties.map((t) => t.length);
  const totalProperties = scoredProperties.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analizando activos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-medium flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            Pirámide de Activos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalProperties} activos · Clasificados por avance en CRM
          </p>
        </div>
        <button
          onClick={() => { setSelectedTier(null); setSelectedProperty(null); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Resetear Vista
        </button>
      </div>

      {/* Pyramid Visualization */}
      <div className="relative">
        <div className="flex flex-col items-center space-y-3">
          {TIER_CONFIG.map((tier, tierIdx) => {
            const propertiesInTier = tieredProperties[tierIdx];
            const avgScore =
              propertiesInTier.length > 0
                ? Math.round(propertiesInTier.reduce((s, p) => s + p.advancementScore, 0) / propertiesInTier.length)
                : 0;
            const isSelected = selectedTier === tierIdx;
            const TierIcon = tier.icon;

            return (
              <motion.div
                key={tier.key}
                layout
                className="relative w-full flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tierIdx * 0.1 }}
              >
                {/* Tier Label */}
                <div
                  className={`w-[${tier.width}] max-w-[${tier.width}] ${tier.bgColor} ${tier.borderColor} border rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                    isSelected ? `shadow-xl ${tier.glowColor} ring-2 ring-primary/30` : "hover:shadow-lg hover:border-primary/30"
                  }`}
                  style={{ width: tier.width, maxWidth: tier.width }}
                  onClick={() => {
                    setSelectedTier(isSelected ? null : tierIdx);
                    setSelectedProperty(null);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${tier.color}20` }}
                      >
                        <TierIcon size={16} style={{ color: tier.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tier.color }}>
                          {tier.labelEs}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {propertiesInTier.length} activo{propertiesInTier.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: tier.color }}>
                        {avgScore}
                      </p>
                      <p className="text-[10px] text-muted-foreground">score medio</p>
                    </div>
                  </div>

                  {/* Property pills */}
                  {propertiesInTier.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {propertiesInTier.slice(0, isSelected ? undefined : 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProperty(p);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            selectedProperty?.id === p.id
                              ? "bg-primary text-white"
                              : "bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                          }`}
                        >
                          {p.title?.slice(0, 20) || "Sin título"} · {p.advancementScore}
                        </button>
                      ))}
                      {!isSelected && propertiesInTier.length > 5 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted/30 text-muted-foreground">
                          +{propertiesInTier.length - 5} más
                        </span>
                      )}
                    </div>
                  )}

                  {propertiesInTier.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 italic">Sin activos en este nivel</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pyramid base decoration */}
        <div className="flex justify-center mt-2">
          <div
            className="h-1 rounded-full opacity-30"
            style={{ width: "100%", backgroundColor: "#c5a059" }}
          />
        </div>
      </div>

      {/* Selected Property Detail Panel */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-medium">{selectedProperty.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProperty.address || "Sin ubicación"}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#333" strokeWidth="2" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#c5a059"
                      strokeWidth="2"
                      strokeDasharray={`${(selectedProperty.advancementScore / 100) * 100.5} 100.5`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{selectedProperty.advancementScore}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg">Score de Avance CRM</p>
                  <p className="text-sm text-muted-foreground">
                    {TIER_CONFIG[getTier(selectedProperty.advancementScore)].labelEs}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Etapa</span>
                  </div>
                  <p className="font-bold">{selectedProperty.stageLabel}</p>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${selectedProperty.pipelineStage}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Interacciones</span>
                  </div>
                  <p className="font-bold">{selectedProperty.interactionCount}</p>
                  <p className="text-xs text-muted-foreground">registradas</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className={selectedProperty.daysSinceActivity < 7 ? "text-emerald-500" : selectedProperty.daysSinceActivity < 30 ? "text-amber-500" : "text-red-500"} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Última Actividad</span>
                  </div>
                  <p className="font-bold">
                    {selectedProperty.daysSinceActivity === 999 ? "Sin actividad" : `${selectedProperty.daysSinceActivity}d`}
                  </p>
                  <p className="text-xs text-muted-foreground">días</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className={selectedProperty.hasNDA ? "text-emerald-500" : "text-muted-foreground"} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">NDA</span>
                  </div>
                  <p className="font-bold">{selectedProperty.hasNDA ? "Firmado" : "Pendiente"}</p>
                  <p className="text-xs text-muted-foreground">acuerdo</p>
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-3">
                {selectedProperty.hasValuation && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                    <FileCheck size={12} /> Valoración Completa
                  </span>
                )}
                {selectedProperty.hasScheduledAction && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold">
                    <Calendar size={12} /> Acción Programada
                  </span>
                )}
                {selectedProperty.hasMeeting && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold">
                    <Users size={12} /> Visita Realizada
                  </span>
                )}
                {!selectedProperty.hasValuation && !selectedProperty.hasScheduledAction && !selectedProperty.hasMeeting && (
                  <span className="px-3 py-1.5 bg-muted/30 text-muted-foreground rounded-full text-xs">
                    Sin indicadores de avance
                  </span>
                )}
              </div>

              {/* Price info */}
              {selectedProperty.price && (
                <div className="p-4 bg-muted/20 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Precio</p>
                  <p className="text-xl font-serif font-bold text-primary">
                    €{(selectedProperty.price / 1000000).toFixed(2)}M
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIER_CONFIG.map((tier, idx) => (
          <div
            key={tier.key}
            className={`p-4 rounded-xl border ${tier.borderColor} ${tier.bgColor} cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setSelectedTier(selectedTier === idx ? null : idx)}
          >
            <div className="flex items-center justify-between mb-2">
              <tier.icon size={16} style={{ color: tier.color }} />
              <span className="text-xs text-muted-foreground">{tierCounts[idx]}</span>
            </div>
            <p className="text-xs font-bold" style={{ color: tier.color }}>{tier.labelEs}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
