import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, TrendingUp, Flame, Star, ChevronUp, 
  ChevronDown, Building, MapPin, Euro, 
  Clock, User, MoreVertical, AlertCircle, Loader2,
  Target, Zap, Crown
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address?: string;
  asset_type: string;
  price?: number;
  thumbnail_url?: string;
  status?: string;
  updated_at: string;
  opportunity_score?: number;
  opportunity_tier?: 'cold' | 'warm' | 'hot' | 'top3';
}

interface OpportunityPyramidProps {
  agentId?: string;
  maxAssets?: number;
  onAssetClick?: (property: Property) => void;
}

// Fallback for Snowflake - defined before use
const Snowflake = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const TIER_CONFIG = {
  top3: {
    label: 'Top 3',
    description: 'Máximo interés y recorrido',
    color: 'from-amber-500 via-yellow-500 to-orange-500',
    bgColor: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/30',
    icon: Crown,
    maxItems: 3,
  },
  hot: {
    label: 'Activos Hot',
    description: 'Alta prioridad',
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-gradient-to-br from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-red-500/30',
    icon: Flame,
    maxItems: 10,
  },
  warm: {
    label: 'Activos Warm',
    description: 'Interés moderado',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/30',
    icon: TrendingUp,
    maxItems: 20,
  },
  cold: {
    label: 'Activos Cold',
    description: 'Seguimiento futuro',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
    glowColor: 'shadow-blue-500/30',
    icon: Snowflake,
    maxItems: 50,
  },
} as const;

export default function OpportunityPyramid({ 
  agentId, 
  maxAssets = 100,
  onAssetClick 
}: OpportunityPyramidProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTier, setExpandedTier] = useState<'top3' | 'hot' | 'warm' | 'cold' | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    top3: 0,
    hot: 0,
    warm: 0,
    cold: 0
  });

  useEffect(() => {
    fetchOpportunities();
  }, [agentId]);

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(maxAssets) });
      if (agentId) params.append('agent_id', agentId);

      const res = await fetch(`/api/properties/opportunities?${params}`);
      const data = await res.json();

      const sorted = (data.properties || []).sort((a: Property, b: Property) => {
        const scoreA = a.opportunity_score || 50;
        const scoreB = b.opportunity_score || 50;
        return scoreB - scoreA;
      });

      setProperties(sorted);
      
      // Calculate stats
      const tierCounts = { total: sorted.length, top3: 0, hot: 0, warm: 0, cold: 0 };
      
      sorted.slice(0, 3).forEach(() => tierCounts.top3++);
      sorted.slice(3, 13).forEach(() => tierCounts.hot++);
      sorted.slice(13, 33).forEach(() => tierCounts.warm++);
      tierCounts.cold = Math.min(sorted.length - 33, 50);

      setStats(tierCounts);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTierForIndex(index: number): Property['opportunity_tier'] {
    if (index < 3) return 'top3';
    if (index < 13) return 'hot';
    if (index < 33) return 'warm';
    return 'cold';
  }

  function getPropertiesByTier(tier: Property['opportunity_tier']): Property[] {
    const tierOrder = ['top3', 'hot', 'warm', 'cold'];
    const tierIndex = tierOrder.indexOf(tier || '');
    const startIndex = tierIndex === 0 ? 0 : tierIndex === 1 ? 3 : tierIndex === 2 ? 13 : 33;
    const endIndex = tierIndex === 0 ? 3 : tierIndex === 1 ? 13 : tierIndex === 2 ? 33 : properties.length;
    
    return properties.slice(startIndex, endIndex);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`bg-card border border-amber-500/30 rounded-2xl p-4 ${TIER_CONFIG.top3.glowColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <Crown size={16} className="text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Top 3</span>
          </div>
          <p className="text-3xl font-bold">{stats.top3}</p>
        </div>

        <div className={`bg-card border border-red-500/30 rounded-2xl p-4 ${TIER_CONFIG.hot.glowColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-red-500" />
            <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Hot</span>
          </div>
          <p className="text-3xl font-bold">{stats.hot}</p>
        </div>

        <div className={`bg-card border border-yellow-500/30 rounded-2xl p-4 ${TIER_CONFIG.warm.glowColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-yellow-500" />
            <span className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Warm</span>
          </div>
          <p className="text-3xl font-bold">{stats.warm}</p>
        </div>

        <div className={`bg-card border border-blue-500/30 rounded-2xl p-4 ${TIER_CONFIG.cold.glowColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <Snowflake size={16} className="text-blue-500" />
            <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">Cold</span>
          </div>
          <p className="text-3xl font-bold">{stats.cold}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building size={16} className="text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total</span>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
      </div>

      {/* Pyramid Visualization */}
      <div className="relative">
        <div className="flex items-end justify-center space-x-4">
          {/* Top3 Apex */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative w-1/4 ${TIER_CONFIG.top3.bgColor} border ${TIER_CONFIG.top3.borderColor} rounded-t-3xl p-6 cursor-pointer`}
            onClick={() => setExpandedTier(expandedTier === 'top3' ? null : 'top3')}
          >
            <div className="text-center mb-4">
              <Crown className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <h3 className="font-serif text-lg font-bold text-amber-500">TOP 3</h3>
              <p className="text-xs text-muted-foreground">Máximo interés</p>
            </div>

            <div className="space-y-2">
              {getPropertiesByTier('top3').slice(0, 3).map((property, idx) => (
                <div
                  key={property.id}
                  className="bg-background/50 rounded-lg p-2 text-center hover:bg-background transition-colors"
                  onMouseEnter={() => setHoveredAsset(property.id)}
                  onMouseLeave={() => setHoveredAsset(null)}
                  onClick={(e) => { e.stopPropagation(); onAssetClick?.(property); }}
                >
                  <p className="text-xs font-medium truncate">{property.title}</p>
                  {hoveredAsset === property.id && (
                    <div className="absolute z-10 bg-card border border-border rounded-lg p-3 shadow-xl -top-20 left-1/2 -translate-x-1/2 w-48">
                      <p className="font-medium text-sm">{property.title}</p>
                      <p className="text-xs text-muted-foreground">{property.address || 'Sin ubicación'}</p>
                      <p className="text-xs text-amber-500 font-bold mt-1">
                        {property.price ? `€${property.price.toLocaleString()}` : 'Precio privado'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-background text-[10px] font-bold px-3 py-1 rounded-full">
              {stats.top3}
            </div>
          </motion.div>

          {/* Hot */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`relative w-1/3 ${TIER_CONFIG.hot.bgColor} border ${TIER_CONFIG.hot.borderColor} rounded-t-3xl p-6 cursor-pointer`}
            onClick={() => setExpandedTier(expandedTier === 'hot' ? null : 'hot')}
          >
            <div className="text-center mb-4">
              <Flame className="w-6 h-6 mx-auto text-red-500 mb-2" />
              <h3 className="font-serif text-lg font-bold text-red-500">HOT</h3>
              <p className="text-xs text-muted-foreground">Alta prioridad</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {getPropertiesByTier('hot').slice(0, 6).map((property, idx) => (
                <div
                  key={property.id}
                  className="bg-background/50 rounded-lg p-2 text-center hover:bg-background transition-colors"
                  onClick={(e) => { e.stopPropagation(); onAssetClick?.(property); }}
                >
                  <p className="text-xs font-medium truncate">{property.title}</p>
                </div>
              ))}
            </div>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-background text-[10px] font-bold px-3 py-1 rounded-full">
              {stats.hot}
            </div>
          </motion.div>
        </div>

        {/* Full Pyramid Row */}
        <div className="flex items-end justify-center space-x-4 mt-4">
          {/* Warm */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`relative w-2/5 ${TIER_CONFIG.warm.bgColor} border ${TIER_CONFIG.warm.borderColor} rounded-t-3xl p-6 cursor-pointer`}
            onClick={() => setExpandedTier(expandedTier === 'warm' ? null : 'warm')}
          >
            <div className="text-center mb-4">
              <TrendingUp className="w-5 h-5 mx-auto text-yellow-500 mb-2" />
              <h3 className="font-serif text-base font-bold text-yellow-500">WARM</h3>
              <p className="text-xs text-muted-foreground">Interés moderado</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {getPropertiesByTier('warm').slice(0, 8).map((property, idx) => (
                <div
                  key={property.id}
                  className="bg-background/50 rounded-lg p-2 text-center hover:bg-background transition-colors"
                  onClick={(e) => { e.stopPropagation(); onAssetClick?.(property); }}
                >
                  <p className="text-[10px] font-medium truncate">{property.title}</p>
                </div>
              ))}
            </div>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-background text-[10px] font-bold px-3 py-1 rounded-full">
              {stats.warm}
            </div>
          </motion.div>

          {/* Cold */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`relative w-3/5 ${TIER_CONFIG.cold.bgColor} border ${TIER_CONFIG.cold.borderColor} rounded-t-3xl p-6 cursor-pointer`}
            onClick={() => setExpandedTier(expandedTier === 'cold' ? null : 'cold')}
          >
            <div className="text-center mb-4">
              <Snowflake className="w-5 h-5 mx-auto text-blue-500 mb-2" />
              <h3 className="font-serif text-base font-bold text-blue-500">COLD</h3>
              <p className="text-xs text-muted-foreground">Seguimiento futuro</p>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {getPropertiesByTier('cold').slice(0, 12).map((property, idx) => (
                <div
                  key={property.id}
                  className="bg-background/50 rounded-lg p-2 text-center hover:bg-background transition-colors"
                  onClick={(e) => { e.stopPropagation(); onAssetClick?.(property); }}
                >
                  <p className="text-[10px] font-medium truncate">{property.title}</p>
                </div>
              ))}
            </div>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-background text-[10px] font-bold px-3 py-1 rounded-full">
              {stats.cold}
            </div>
          </motion.div>
        </div>

        {/* Expanded Tier Detail */}
        <AnimatePresence>
          {expandedTier && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
              onClick={() => setExpandedTier(null)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="relative bg-card border border-border rounded-[2rem] p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setExpandedTier(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${TIER_CONFIG[expandedTier].bgColor} border ${TIER_CONFIG[expandedTier].borderColor} mb-6`}>
                  {(() => {
                    const Icon = TIER_CONFIG[expandedTier].icon;
                    return <Icon size={16} className={TIER_CONFIG[expandedTier].color.split(' ')[1]} />;
                  })()}
                  <span className={`font-serif font-bold ${TIER_CONFIG[expandedTier].color.split(' ')[1]}`}>
                    {TIER_CONFIG[expandedTier].label}
                  </span>
                </div>

                <h2 className="font-serif text-3xl mb-2">{TIER_CONFIG[expandedTier].description}</h2>
                <p className="text-muted-foreground mb-6">
                  {getPropertiesByTier(expandedTier as any).length} activos en esta categoría
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getPropertiesByTier(expandedTier as any).map((property, idx) => (
                    <div
                      key={property.id}
                      className="bg-muted/30 border border-border rounded-2xl p-4 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => onAssetClick?.(property)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{property.title}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin size={10} />
                            {property.address || 'Ubicación privada'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                          <Star size={10} />
                          {property.opportunity_score || 50}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{property.asset_type}</span>
                        <span className="font-bold text-amber-500">
                          {property.price ? `€${property.price.toLocaleString()}` : 'Privado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Crown size={12} className="text-amber-500" />
          <span>Top 3 - Máximo interés</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame size={12} className="text-red-500" />
          <span>Hot - Alta prioridad</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-yellow-500" />
          <span>Warm - Interés moderado</span>
        </div>
        <div className="flex items-center gap-2">
          <Snowflake size={12} className="text-blue-500" />
          <span>Cold - Seguimiento futuro</span>
        </div>
      </div>
    </div>
  );
}
