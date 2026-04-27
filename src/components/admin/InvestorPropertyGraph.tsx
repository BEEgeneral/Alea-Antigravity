'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Building2, ZoomIn, ZoomOut, Maximize2,
  ArrowRight, Filter, Loader2, RefreshCw, ChevronDown
} from 'lucide-react';

interface GraphInvestor {
  id: string;
  full_name: string;
  company_name?: string;
  max_ticket_eur?: number;
}

interface GraphProperty {
  id: string;
  title: string;
  address?: string;
  price?: number;
  asset_type?: string;
}

interface GraphInterest {
  id: string;
  investor_id: string;
  property_id?: string;
  role: 'buyer' | 'seller' | 'both';
  status: string;
  match_score?: number;
  investor?: GraphInvestor;
  property?: GraphProperty;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BUY_COLOR = '#22c55e';   // green
const SELL_COLOR = '#ef4444'; // red
const BOTH_COLOR = '#c5a059'; // amber

export default function InvestorPropertyGraph({ isOpen, onClose }: Props) {
  const [interests, setInterests] = useState<GraphInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'both'>('all');
  const [selectedNode, setSelectedNode] = useState<{ type: 'investor' | 'property'; data: any } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch('/api/investor-interests?status=all&limit=500', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando relaciones');
      setInterests(data.interests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchGraph();
  }, [isOpen, fetchGraph]);

  // Build node list
  const { investors, properties } = useMemo(() => {
    const invMap = new Map<string, GraphInvestor>();
    const propMap = new Map<string, GraphProperty>();
    interests.forEach(i => {
      if (i.investor) invMap.set(i.investor_id, i.investor as GraphInvestor);
      if (i.property && i.property_id) propMap.set(i.property_id, i.property as GraphProperty);
    });
    return { investors: Array.from(invMap.values()), properties: Array.from(propMap.values()) };
  }, [interests]);

  const filteredInterests = useMemo(() =>
    roleFilter === 'all' ? interests : interests.filter(i => i.role === roleFilter),
    [interests, roleFilter]
  );

  // SVG Layout — force-directed simulation (simplified)
  const NODE_R = 28;
  const INV_COLS = 3;
  const PROP_COLS = 3;

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const W = 700, H = 500;
    const pad = 80;

    // Place investors on left side
    investors.forEach((inv, i) => {
      const col = i % INV_COLS;
      const row = Math.floor(i / INV_COLS);
      positions[`inv_${inv.id}`] = {
        x: pad + col * (W / INV_COLS),
        y: pad + row * 110 + 40,
      };
    });

    // Place properties on right side
    properties.forEach((prop, i) => {
      const col = i % PROP_COLS;
      const row = Math.floor(i / PROP_COLS);
      positions[`prop_${prop.id}`] = {
        x: W - pad - col * (W / PROP_COLS),
        y: pad + row * 110 + 40,
      };
    });

    return positions;
  }, [investors, properties]);

  const edgeColor = (role: string) =>
    role === 'buyer' ? BUY_COLOR : role === 'seller' ? SELL_COLOR : BOTH_COLOR;

  const edgeDash = (role: string) =>
    role === 'seller' ? '5,5' : role === 'both' ? '3,3' : '0';

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#111] border border-[#c5a059]/20 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c5a059]/20 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c5a059]/20 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-[#c5a059]" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#c5a059]">Red Inversor ↔ Activos</h2>
              <p className="text-xs text-white/40">{investors.length} inversores · {properties.length} activos · {filteredInterests.length} relaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#c5a059]/20 rounded-xl px-3 py-1.5">
              <Filter size={12} className="text-white/40" />
              {(['all', 'buyer', 'seller', 'both'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setRoleFilter(f)}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    roleFilter === f
                      ? f === 'all' ? 'bg-[#c5a059] text-black' : f === 'buyer' ? 'bg-green-500 text-black' : f === 'seller' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {f === 'all' ? 'Todos' : f === 'buyer' ? 'Compradores' : f === 'seller' ? 'Vendedores' : 'Ambos'}
                </button>
              ))}
            </div>
            <button onClick={fetchGraph} disabled={loading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <RefreshCw size={14} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={16} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-6 py-2 border-b border-white/5 bg-[#111]">
          {[
            { color: BUY_COLOR, label: 'Quiere comprar' },
            { color: SELL_COLOR, label: 'Quiere vender' },
            { color: BOTH_COLOR, label: 'Ambos' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-1.5 hover:bg-white/10 rounded-lg">
              <ZoomIn size={14} className="text-white/50" />
            </button>
            <span className="text-[10px] text-white/30">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="p-1.5 hover:bg-white/10 rounded-lg">
              <ZoomOut size={14} className="text-white/50" />
            </button>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-[#c5a059]/40" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-400 text-sm mb-2">{error}</p>
                <button onClick={fetchGraph} className="px-4 py-2 bg-[#222] rounded-xl text-xs text-white/70 hover:bg-[#333]">Reintentar</button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto p-4">
              <svg
                width={700 * zoom}
                height={Math.max(500, (investors.length / INV_COLS + properties.length / PROP_COLS) * 110 + 160) * zoom}
                style={{ minWidth: 700, minHeight: 500, cursor: dragging ? 'grabbing' : 'grab' }}
                onMouseDown={(e) => { if (e.button === 0) { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); } }}
                onMouseMove={(e) => { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
                onMouseUp={() => setDragging(false)}
                onMouseLeave={() => setDragging(false)}
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {filteredInterests.map(edge => {
                    const from = nodePositions[`inv_${edge.investor_id}`];
                    const to = edge.property_id ? nodePositions[`prop_${edge.property_id}`] : null;
                    if (!from || !to) return null;
                    const mx = (from.x + to.x) / 2;
                    const my = (from.y + to.y) / 2 - 20;
                    return (
                      <g key={edge.id}>
                        <path
                          d={`M ${from.x + NODE_R} ${from.y} Q ${mx} ${my} ${to.x - NODE_R} ${to.y}`}
                          stroke={edgeColor(edge.role)}
                          strokeWidth={2}
                          strokeDasharray={edgeDash(edge.role)}
                          fill="none"
                          opacity={0.6}
                          strokeLinecap="round"
                        />
                        <text
                          x={mx}
                          y={my}
                          textAnchor="middle"
                          fontSize="8"
                          fill={edgeColor(edge.role)}
                          fillOpacity={0.7}
                        >
                          {edge.role === 'buyer' ? '→ COMPRA' : edge.role === 'seller' ? '← VENDE' : '↔ AMBAS'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Investor nodes */}
                  {investors.map(inv => {
                    const pos = nodePositions[`inv_${inv.id}`];
                    if (!pos) return null;
                    return (
                      <g
                        key={inv.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode({ type: 'investor', data: inv })}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle r={NODE_R} fill="#1a1a1a" stroke="#c5a059" strokeWidth="2" />
                        <text textAnchor="middle" dy="0.35em" fontSize="11" fill="#c5a059" fontFamily="serif" fontWeight="medium">
                          {inv.full_name?.charAt(0) || '?'}
                        </text>
                        <text y={NODE_R + 14} textAnchor="middle" fontSize="9" fill="white" fillOpacity="0.6">
                          {inv.full_name?.split(' ')[0] || inv.full_name}
                        </text>
                        {inv.max_ticket_eur && (
                          <text y={NODE_R + 25} textAnchor="middle" fontSize="7" fill="#c5a059" fillOpacity="0.6">
                            ≤{(inv.max_ticket_eur / 1000000).toFixed(0)}M€
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Property nodes */}
                  {properties.map(prop => {
                    const pos = nodePositions[`prop_${prop.id}`];
                    if (!pos) return null;
                    const priceLabel = prop.price ? `${(prop.price / 1000000).toFixed(1)}M€` : '';
                    return (
                      <g
                        key={prop.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode({ type: 'property', data: prop })}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect x={-NODE_R} y={-NODE_R} width={NODE_R * 2} height={NODE_R * 2}
                          rx="6" fill="#1a1a1a" stroke="#3b82f6" strokeWidth="2" />
                        <text textAnchor="middle" dy="0.35em" fontSize="10" fill="#3b82f6">
                          <Building2 size={12} x={-6} y={-6} />
                        </text>
                        <text y={NODE_R + 14} textAnchor="middle" fontSize="9" fill="white" fillOpacity="0.6">
                          {prop.title?.slice(0, 16) || 'Sin título'}
                        </text>
                        {priceLabel && (
                          <text y={NODE_R + 25} textAnchor="middle" fontSize="7" fill="#3b82f6" fillOpacity="0.6">
                            {priceLabel}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          )}
        </div>

        {/* Node Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#c5a059]/20 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  {selectedNode.type === 'investor' ? (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-[#c5a059] mb-1">Inversor</p>
                      <h3 className="font-serif text-white text-lg">{selectedNode.data.full_name}</h3>
                      <p className="text-xs text-white/40">{selectedNode.data.company_name || 'Sin empresa'}</p>
                      {selectedNode.data.max_ticket_eur && (
                        <p className="text-xs text-[#c5a059] mt-1">Ticket máximo: {selectedNode.data.max_ticket_eur.toLocaleString('es-ES')}€</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-blue-400 mb-1">Activo</p>
                      <h3 className="font-serif text-white text-lg">{selectedNode.data.title}</h3>
                      <p className="text-xs text-white/40">{selectedNode.data.address || selectedNode.data.asset_type || ''}</p>
                      {selectedNode.data.price && (
                        <p className="text-xs text-blue-400 mt-1">{selectedNode.data.price.toLocaleString('es-ES')}€</p>
                      )}
                    </>
                  )}
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={14} className="text-white/40" />
                </button>
              </div>
              {/* Related interests */}
              <div className="mt-3 flex flex-wrap gap-2">
                {filteredInterests
                  .filter(i => selectedNode.type === 'investor'
                    ? i.investor_id === selectedNode.data.id
                    : i.property_id === selectedNode.data.id)
                  .map(i => (
                    <span
                      key={i.id}
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border"
                      style={{
                        color: edgeColor(i.role),
                        borderColor: edgeColor(i.role) + '40',
                        backgroundColor: edgeColor(i.role) + '10',
                      }}
                    >
                      {i.role === 'buyer' ? '→ COMPRA' : i.role === 'seller' ? '← VENDE' : '↔ AMBAS'}
                      {' · '}{i.property?.title?.slice(0, 12) || i.investor?.full_name?.split(' ')[0] || ''}
                    </span>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
