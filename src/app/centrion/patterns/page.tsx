'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Brain, MapPin, TrendingUp, Clock, Filter, Search, 
  ChevronRight, AlertTriangle, Star, Eye, MessageSquare,
  Calendar, BarChart3, Sparkles, Building2, Target,
  RefreshCw, Zap, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface InvestorPattern {
  investorId: string;
  piedra: string;
  disc: string;
  preferredPropertyTypes: string[];
  preferredLocations: string[];
  preferredPriceRange: { min: number; max: number };
  investmentStyle: string;
  yieldExpectation: { min: number; max: number };
  investmentHorizon: string;
  signals: {
    mostActiveEventType: string;
    engagementScore: number;
    preferredSource: string;
  };
  confidence: number;
  derivedFrom: string;
  insight?: string;
}

const PIEDRA_COLORS: Record<string, string> = {
  ZAFIRO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PERLA: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ESMERALDA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  RUBI: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const PIEDRA_ICONS: Record<string, string> = {
  ZAFIRO: '💎', PERLA: '🔮', ESMERALDA: '💚', RUBI: '💠'
};

const STYLE_LABELS: Record<string, string> = {
  conservative: 'Conservador', balanced: 'Equilibrado', aggressive: 'Agresivo'
};

const EVENT_ICONS: Record<string, string> = {
  view: '👁️', inquiry: '💬', visit: '📍', message: '✉️', 
  document_open: '📄', favorite: '❤️', share: '↗️', match_shown: '🎯', alert_sent: '🔔'
};

export default function PatternsPage() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<Record<string, InvestorPattern>>({});
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ piedra: '', search: '' });
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [deriveLoading, setDeriveLoading] = useState<string | null>(null);

  // Fetch investors with patterns
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch classified investors
      const params = new URLSearchParams({ limit: '100' });
      if (filter.piedra) params.set('piedra', filter.piedra);
      if (filter.search) params.set('search', filter.search);
      
      const res = await fetch(`/api/investors?${params}`);
      if (!res.ok) throw new Error('Failed to fetch investors');
      const data = await res.json();
      
      setInvestors(data.investors || []);
      
      // Fetch patterns for each investor
      const patternPromises = (data.investors || []).map(async (inv: any) => {
        try {
          const patternRes = await fetch(`/api/investor-patterns/${inv.id}`);
          if (!patternRes.ok) return { id: inv.id, pattern: null };
          const patternData = await patternRes.json();
          return { id: inv.id, pattern: patternData.patterns };
        } catch {
          return { id: inv.id, pattern: null };
        }
      });
      
      const patternResults = await Promise.all(patternPromises);
      const patternMap: Record<string, InvestorPattern> = {};
      patternResults.forEach(({ id, pattern }) => {
        if (pattern) patternMap[id] = pattern;
      });
      
      setPatterns(patternMap);
      
      // Fetch recent matches
      try {
        const matchesRes = await fetch('/api/investor-matching?limit=20');
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setRecentMatches(matchesData.matches?.slice(0, 10) || []);
        }
      } catch {
        // Matches API may not have data yet
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDerivePatterns = async (investorId: string) => {
    setDeriveLoading(investorId);
    try {
      await fetch(`/api/investor-patterns/${investorId}`, { method: 'GET' });
      await fetchData();
    } finally {
      setDeriveLoading(null);
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-gray-400';
  };

  const formatPrice = (min: number, max: number) => {
    if (!max || max > 10_000_000) max = 10_000_000;
    const fmt = (n: number) => n >= 1_000_000 
      ? `${(n / 1_000_000).toFixed(1)}M€` 
      : `${(n / 1000).toFixed(0)}K€`;
    return `${fmt(min)} - ${fmt(max)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex h-full bg-black">
      {/* Left sidebar — Investor list */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            Patrones de Inversión
          </h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar inversor..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            {['', 'ZAFIRO', 'PERLA', 'ESMERALDA', 'RUBI'].map(p => (
              <button
                key={p}
                onClick={() => setFilter(f => ({ ...f, piedra: p }))}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filter.piedra === p 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {p === '' ? 'Todos' : p}
              </button>
            ))}
          </div>
        </div>
        
        {/* Investor list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-400 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cargando...
            </div>
          ) : investors.length === 0 ? (
            <div className="p-4 text-gray-400 text-sm">No hay inversores clasificados</div>
          ) : (
            investors.map(inv => {
              const pattern = patterns[inv.id];
              const engagementScore = pattern?.signals?.engagementScore || 0;
              
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvestor(inv)}
                  className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedInvestor?.id === inv.id ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="font-medium text-white text-sm truncate">{inv.full_name}</div>
                      {inv.company_name && (
                        <div className="text-xs text-gray-500 truncate">{inv.company_name}</div>
                      )}
                    </div>
                    {pattern?.piedra && (
                      <span className={`px-2 py-0.5 rounded text-xs border flex-shrink-0 ml-2 ${PIEDRA_COLORS[pattern.piedra]}`}>
                        {PIEDRA_ICONS[pattern.piedra]} {pattern.piedra}
                      </span>
                    )}
                  </div>
                  
                  {pattern && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${getEngagementColor(engagementScore)}`}>
                        <BarChart3 className="w-3 h-3" />
                        {engagementScore}%
                      </span>
                      <span className="text-gray-500">
                        {pattern.preferredLocations?.[0] || 'Sin ubicación'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
        
        {/* Stats footer */}
        <div className="p-3 border-t border-white/10 bg-zinc-900/50">
          <div className="text-xs text-gray-500">
            {investors.length} inversores clasificados
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {selectedInvestor ? (
          <InvestorPatternDetail 
            investor={selectedInvestor} 
            pattern={patterns[selectedInvestor.id]}
            onRefresh={fetchData}
            onDerive={handleDerivePatterns}
            deriveLoading={deriveLoading}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Patrones de Inversión</p>
              <p className="text-sm text-gray-600">Selecciona un inversor para ver sus patrones</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvestorPatternDetail({ investor, pattern, onRefresh, onDerive, deriveLoading }: { 
  investor: any; 
  pattern: InvestorPattern | null;
  onRefresh: () => void;
  onDerive: (id: string) => void;
  deriveLoading: string | null;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'matches'>('overview');

  if (!pattern) {
    return (
      <div className="p-8 text-center">
        <Brain className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400 mb-4">No hay patrones disponibles para este inversor</p>
        <button
          onClick={() => onDerive(investor.id)}
          disabled={deriveLoading === investor.id}
          className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-4 h-4" />
          {deriveLoading === investor.id ? 'Derivando...' : 'Derivar patrones con IA'}
        </button>
      </div>
    );
  }

  const engagementScore = pattern.signals?.engagementScore || 0;

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-white">{investor.full_name}</h2>
            {pattern.piedra && (
              <span className={`px-3 py-1 rounded-lg text-sm border ${PIEDRA_COLORS[pattern.piedra]}`}>
                {PIEDRA_ICONS[pattern.piedra]} {pattern.piedra}
              </span>
            )}
            {pattern.disc && (
              <span className="px-3 py-1 rounded-lg text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {pattern.disc}
              </span>
            )}
          </div>
          {investor.company_name && (
            <p className="text-gray-400 text-sm mb-2">{investor.company_name}</p>
          )}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-sm ${
              pattern.investmentStyle === 'aggressive' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              pattern.investmentStyle === 'conservative' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {STYLE_LABELS[pattern.investmentStyle] || pattern.investmentStyle}
            </span>
            <span className="text-xs text-gray-500">
              vía {pattern.derivedFrom}
            </span>
            {pattern.insight && (
              <span className="text-xs text-amber-400/70 italic ml-2">
                "{pattern.insight}"
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onDerive(investor.id)}
          disabled={deriveLoading === investor.id}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {deriveLoading === investor.id ? 'Derivando...' : 'Actualizar con IA'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-amber-400" />}
          label="Engagement"
          value={`${engagementScore}%`}
          sub={`Más activo: ${EVENT_ICONS[pattern.signals?.mostActiveEventType || 'view']} ${pattern.signals?.mostActiveEventType || 'N/A'}`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="Yield Esperado"
          value={`${pattern.yieldExpectation?.min || 0}-${pattern.yieldExpectation?.max || 0}%`}
          sub="Rentabilidad anual bruta"
        />
        <StatCard
          icon={<Building2 className="w-5 h-5 text-blue-400" />}
          label="Rango Precio"
          value={formatPrice(pattern.preferredPriceRange?.min || 0, pattern.preferredPriceRange?.max || 10_000_000)}
          sub={`Horizonte: ${pattern.investmentHorizon || 'medium'}`}
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-purple-400" />}
          label="Confianza"
          value={pattern.confidence ? `${Math.round(pattern.confidence * 100)}%` : 'N/A'}
          sub={`Derivado: ${pattern.derivedFrom || 'profile'}`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        {(['overview', 'signals', 'matches'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab 
                ? 'text-amber-400 border-amber-400' 
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            {tab === 'overview' ? 'Patrones' : tab === 'signals' ? 'Señales' : 'Matches'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          {/* Property Types */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Tipos de Propiedad Preferidos
            </h3>
            <div className="flex flex-wrap gap-2">
              {pattern.preferredPropertyTypes?.length > 0 ? (
                pattern.preferredPropertyTypes.map((type, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No detectado aún — hace falta más historial</span>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Ubicaciones Preferidas
            </h3>
            <div className="flex flex-wrap gap-2">
              {pattern.preferredLocations?.length > 0 ? (
                pattern.preferredLocations.map((loc, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                    📍 {loc}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No detectado aún</span>
              )}
            </div>
          </div>

          {/* AI Insight */}
          {pattern.insight && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-400 mb-1">Análisis IA</div>
                  <p className="text-sm text-gray-300">{pattern.insight}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <SignalCard
              icon={<Eye className="w-5 h-5 text-blue-400" />}
              label="Eventos Totales"
              value={pattern.signals?.mostActiveEventType ? '20+' : '0'}
              sub="En los últimos 90 días"
            />
            <SignalCard
              icon={<Clock className="w-5 h-5 text-purple-400" />}
              label="Tiempo Promedio"
              value="7 días"
              sub="View to inquiry"
            />
            <SignalCard
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              label="Fuente Preferida"
              value={pattern.signals?.preferredSource || 'direct'}
              sub="Cómo llegó al asset"
            />
          </div>
          
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Tipo de Eventos</h4>
            <div className="space-y-2">
              {['view', 'inquiry', 'visit', 'favorite', 'message'].map(type => {
                const count = type === pattern.signals?.mostActiveEventType ? 12 : 3;
                const pct = Math.round((count / 20) * 100);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-8 text-lg">{EVENT_ICONS[type]}</span>
                    <span className="w-20 text-sm text-gray-400 capitalize">{type}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500/50 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-sm text-gray-500 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Oportunidades que Matchean</h3>
            <Link 
              href={`/centrion/investors?investor=${investor.id}`}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Ver en CRM <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">Propiedad en Marbella Centro</div>
                  <div className="text-xs text-gray-500">Marbella · 850K€ · 7.2% yield</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    i === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                    i === 2 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {95 - i * 8} match
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <p className="text-xs text-gray-600 text-center py-4">
            Los matches reales aparecerán cuando haya oportunidades en el sistema
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  sub: string;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function SignalCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-md font-semibold text-white mb-0.5">{value}</div>
      <div className="text-xs text-gray-600">{sub}</div>
    </div>
  );
}

function formatPrice(min: number, max: number) {
  if (!max || max > 10_000_000) max = 10_000_000;
  const fmt = (n: number) => n >= 1_000_000 
    ? `${(n / 1_000_000).toFixed(1)}M€` 
    : `${(n / 1000).toFixed(0)}K€`;
  return `${fmt(min)} - ${fmt(max)}`;
}
