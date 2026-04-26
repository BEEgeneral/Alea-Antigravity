'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, Loader2, Download, BarChart3, PieChart,
  DollarSign, Percent, Calculator, Building2, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Minus, FileText, RefreshCw,
  ChevronDown, ExternalLink, Info
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address?: string;
  price?: number;
  meters?: number;
  type?: string;
  cap_rate?: number;
  monthly_rent?: number;
  community_fee?: number;
  insurance?: number;
  maintenance?: number;
  ibi_tax?: number;
  vendor_name?: string;
  year_built?: number;
  energy_rating?: string;
  description?: string;
  [key: string]: any;
}

interface Props {
  property: Property;
  onClose: () => void;
}

type Tab = 'summary' | 'financial' | 'market' | 'report';

interface KeyMetric {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export default function FinancialReportModal({ property, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [investorProfile, setInvestorProfile] = useState<'family_office' | 'hnw' | 'regional'>('family_office');

  // Computed financial metrics
  const price = property.price || 0;
  const meters = property.meters || 0;
  const monthlyRent = property.monthly_rent || 0;
  const pricePerSqm = price && meters ? Math.round(price / meters) : 0;

  const costs = {
    community: property.community_fee || 0,
    insurance: property.insurance || 0,
    maintenance: property.maintenance || 0,
    ibi: property.ibi_tax || 0,
  };
  const totalAnnualCosts = Object.values(costs).reduce((s, v) => s + v, 0);
  const grossYield = price > 0 ? ((monthlyRent * 12) / price) * 100 : 0;
  const netYield = price > 0 ? ((monthlyRent * 12 - totalAnnualCosts) / price) * 100 : 0;
  const annualNOI = monthlyRent * 12 - totalAnnualCosts;
  const capRate = price > 0 ? (annualNOI / price) * 100 : 0;

  // Equity / financing
  const equity = Math.round(price * 0.4);
  const financing = Math.round(price * 0.6);
  const financingRate = 3.5;
  const monthlyMortgage = financing > 0
    ? (financing * (financingRate / 100 / 12) * Math.pow(1 + financingRate / 100 / 12, 240)) /
      (Math.pow(1 + financingRate / 100 / 12, 240) - 1)
    : 0;
  const annualDebtService = monthlyMortgage * 12;
  const annualCashFlow = annualNOI - annualDebtService;
  const cashOnCash = equity > 0 ? (annualCashFlow / equity) * 100 : 0;

  const recommendation = netYield >= 6 ? 'BUY' : netYield >= 4 ? 'HOLD' : 'SELL';
  const recColor = { BUY: 'text-emerald-400', HOLD: 'text-amber-400', SELL: 'text-red-400' }[recommendation];
  const recBg = { BUY: 'bg-emerald-500/10', HOLD: 'bg-amber-500/10', SELL: 'bg-red-500/10' }[recommendation];
  const recBorder = { BUY: 'border-emerald-500/30', HOLD: 'border-amber-500/30', SELL: 'border-red-500/30' }[recommendation];
  const recIcon = { BUY: <ArrowUpRight size={20} />, HOLD: <Minus size={20} />, SELL: <ArrowDownRight size={20} /> }[recommendation];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Resumen', icon: <ShieldAlert size={14} /> },
    { id: 'financial', label: 'Análisis', icon: <Calculator size={14} /> },
    { id: 'market', label: 'Mercado', icon: <BarChart3 size={14} /> },
    { id: 'report', label: 'Informe .md', icon: <FileText size={14} /> },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch('/api/financial-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          propertyId: property.id,
          options: { includeAmortization: true, includeMarket: true, includePDFAnalysis: true, investorProfile },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando informe');
      setReportMarkdown(data.reportMarkdown);
      setReportId(data.reportId);
      setActiveTab('report');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!reportMarkdown) return;
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_financiero_${property.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFetchExisting = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch(`/api/financial-report?propertyId=${property.id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (data.report) {
        setReportMarkdown(data.report.report_markdown);
        setReportId(data.report.id);
        setActiveTab('report');
      } else {
        setError('No hay informe guardado para este activo. Genera uno nuevo.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const kpis: KeyMetric[] = [
    { label: 'Precio', value: price > 0 ? `${price.toLocaleString('es-ES')} €` : 'N/A', sub: pricePerSqm > 0 ? `${pricePerSqm.toLocaleString('es-ES')} €/m²` : undefined, trend: 'neutral' },
    { label: 'Alquiler mensal', value: monthlyRent > 0 ? `${monthlyRent.toLocaleString('es-ES')} €` : 'N/A', trend: 'neutral' },
    { label: 'Yield Bruta', value: grossYield > 0 ? `${grossYield.toFixed(2)}%` : 'N/A', sub: 'Bruta', trend: grossYield >= 5 ? 'up' : grossYield < 3 ? 'down' : 'neutral' },
    { label: 'Yield Neta', value: netYield > 0 ? `${netYield.toFixed(2)}%` : 'N/A', sub: 'Tras costes', trend: netYield >= 5 ? 'up' : netYield < 3 ? 'down' : 'neutral' },
    { label: 'Cap Rate', value: capRate > 0 ? `${capRate.toFixed(2)}%` : 'N/A', trend: capRate >= 6 ? 'up' : 'neutral' },
    { label: 'Cash-on-Cash', value: cashOnCash !== 0 ? `${cashOnCash.toFixed(2)}%` : 'N/A', sub: 'Anual', trend: cashOnCash >= 8 ? 'up' : cashOnCash < 0 ? 'down' : 'neutral' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        className="w-full max-w-5xl bg-[#111] border border-[#c5a059]/20 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-[#1a1a1a] border-b border-[#c5a059]/20 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={22} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium text-[#c5a059]">Informe Financiero</h2>
                <p className="text-xs text-white/40 mt-0.5">{property.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Profile selector */}
              <select
                value={investorProfile}
                onChange={e => setInvestorProfile(e.target.value as any)}
                className="bg-[#222] border border-[#c5a059]/20 text-white/70 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#c5a059]/50"
              >
                <option value="family_office">Family Office</option>
                <option value="hnw">HNW</option>
                <option value="regional">Regional</option>
              </select>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={18} className="text-white/60" />
              </button>
            </div>
          </div>

          {/* Recommendation Banner */}
          <div className={`mt-4 flex items-center gap-3 px-5 py-3 rounded-xl border ${recBg} ${recBorder}`}>
            <span className={recColor}>{recIcon}</span>
            <div>
              <p className={`text-sm font-bold uppercase tracking-widest ${recColor}`}>
                {recommendation === 'BUY' ? '✅ RECOMENDADO PARA COMPRA' : recommendation === 'HOLD' ? '⚠️ MANTENER BAJO OBSERVACIÓN' : '🔴 CONSIDERAR DESINVERSIÓN'}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Perfil: {investorProfile === 'family_office' ? 'Family Office' : investorProfile === 'hnw' ? 'High Net Worth' : 'Inversor Regional'} · Yield neta: {netYield.toFixed(2)}% · Cash-on-Cash: {cashOnCash.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-5 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#222] text-[#c5a059] border-[#c5a059]'
                    : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 min-h-[400px]">
          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">{kpi.label}</span>
                      {kpi.trend === 'up' && <ArrowUpRight size={12} className="text-emerald-400" />}
                      {kpi.trend === 'down' && <ArrowDownRight size={12} className="text-red-400" />}
                      {kpi.trend === 'neutral' && <Minus size={12} className="text-white/20" />}
                    </div>
                    <p className={`text-xl font-serif font-medium ${kpi.color || 'text-white'}`}>{kpi.value}</p>
                    {kpi.sub && <p className="text-[10px] text-white/30 mt-0.5">{kpi.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">Datos del Activo</h3>
                  <div className="space-y-3">
                    {[
                      ['Dirección', property.address || 'N/A'],
                      ['Superficie', property.meters ? `${property.meters} m²` : 'N/A'],
                      ['Tipo', property.type || 'N/A'],
                      ['Año', property.year_built || 'N/A'],
                      ['Energy', property.energy_rating || 'N/A'],
                      ['Vendor', property.vendor_name || 'N/A'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{label}</span>
                        <span className="text-xs text-white font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">Costes Anuales</h3>
                  <div className="space-y-3">
                    {[
                      ['Comunidad', costs.community],
                      ['IBI', costs.ibi],
                      ['Seguro', costs.insurance],
                      ['Mantenimiento', costs.maintenance],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{label}</span>
                        <span className="text-xs text-white font-medium">{(typeof value === 'number' && value > 0) ? `${value.toLocaleString('es-ES')} €` : 'N/A'}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#c5a059]/10 pt-2 mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white/60">TOTAL</span>
                      <span className="text-sm font-serif font-bold text-amber-400">{totalAnnualCosts.toLocaleString('es-ES')} €/año</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                  {generating ? 'Generando...' : 'Generar Informe Completo'}
                </button>
                <button
                  onClick={handleFetchExisting}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#222] hover:bg-[#333] disabled:opacity-50 text-white/80 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-colors"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Cargar Informe Guardado
                </button>
                {reportMarkdown && (
                  <>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#222] hover:bg-[#333] text-white/80 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-colors"
                    >
                      <Download size={14} />
                      Descargar .md
                    </button>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* FINANCIAL TAB */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Yield comparison */}
                <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">Rentabilidades</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Bruta', value: grossYield, benchmark: 5, color: '#c5a059' },
                      { label: 'Neta', value: netYield, benchmark: 4, color: '#22c55e' },
                      { label: 'Cap Rate', value: capRate, benchmark: 6, color: '#3b82f6' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/60">{item.label}</span>
                          <span className="text-sm font-serif font-bold" style={{ color: item.color }}>{item.value.toFixed(2)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(item.value * 5, 100)}%`, backgroundColor: item.color }}
                          />
                        </div>
                        <p className="text-[9px] text-white/30 mt-1">Benchmark: {item.benchmark}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cash flow */}
                <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">Flujo de Caja (Anual)</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Alquiler bruto', value: monthlyRent * 12, positive: true },
                      { label: 'Costes operativos', value: -totalAnnualCosts, positive: false },
                      { label: 'NOI', value: annualNOI, positive: true },
                      { label: 'Debt service', value: -annualDebtService, positive: false },
                      { label: 'Cash flow', value: annualCashFlow, positive: annualCashFlow >= 0 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{item.label}</span>
                        <span className={`text-xs font-serif font-bold ${item.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.value >= 0 ? '+' : ''}{item.value.toLocaleString('es-ES')} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financing structure */}
                <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">Estructura de Financiación</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">Equity (40%)</span>
                        <span className="text-white font-medium">{equity.toLocaleString('es-ES')} €</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-[#c5a059] rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">Financiación (60%)</span>
                        <span className="text-white font-medium">{financing.toLocaleString('es-ES')} €</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div className="border-t border-[#c5a059]/10 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Tipo interés</span>
                        <span className="text-white">{financingRate}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Plazo</span>
                        <span className="text-white">20 años</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Cuota mensal</span>
                        <span className="text-amber-400 font-medium">{Math.round(monthlyMortgage).toLocaleString('es-ES')} €/mes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment metrics */}
                <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">Métricas de Inversión</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Cash-on-Cash Return', value: cashOnCash, suffix: '%', good: (v: number) => v >= 8 },
                      { label: 'Equity Multiple', value: annualNOI > 0 && equity > 0 ? (annualNOI / equity) * 100 : 0, suffix: '%', good: (v: number) => v >= 10 },
                      { label: 'Break-even Occupancy', value: annualDebtService > 0 && monthlyRent > 0 ? (annualDebtService / (monthlyRent * 12)) * 100 : 0, suffix: '%', good: (v: number) => v <= 70 },
                    ].map(metric => {
                      const isGood = metric.good(metric.value);
                      return (
                        <div key={metric.label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-white/40">{metric.label}</span>
                            <span className={`text-sm font-serif font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                              {metric.value.toFixed(1)}{metric.suffix}
                            </span>
                          </div>
                          <div className="h-1 bg-[#222] rounded-full">
                            <div className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(metric.value, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MARKET TAB */}
          {activeTab === 'market' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 size={48} className="text-[#c5a059]/30 mb-4" />
              <h3 className="text-sm font-serif text-white/60 mb-2">Análisis de Mercado</h3>
              <p className="text-xs text-white/30 max-w-sm">
                El análisis comparativo de mercado se genera automáticamente al crear el informe financiero completo.
              </p>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                Generar con Datos de Mercado
              </button>
            </div>
          )}

          {/* REPORT TAB */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              {reportMarkdown ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">
                        Informe guardado: {reportId && !reportId.startsWith('local') ? `ID: ${reportId.slice(0, 8)}...` : 'Local'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadMarkdown}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#222] hover:bg-[#333] text-white/80 text-xs font-bold rounded-lg border border-white/10 transition-colors"
                      >
                        <Download size={12} />
                        Descargar .md
                      </button>
                      <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Regenerar
                      </button>
                    </div>
                  </div>
                  {/* Render markdown as HTML */}
                  <div className="bg-[#1a1a1a] border border-[#c5a059]/10 rounded-xl p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
                    <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {reportMarkdown.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-serif font-bold text-[#c5a059] mt-6 mb-3">{line.slice(2)}</h1>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-serif font-medium text-white mt-5 mb-2">{line.slice(3)}</h2>;
                        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-white/80 mt-4 mb-2">{line.slice(4)}</h3>;
                        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-[#c5a059]/40 pl-4 italic text-white/50 my-2">{line.slice(2)}</blockquote>;
                        if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-4" />;
                        if (line.startsWith('| ')) {
                          // Simple table rendering
                          const cells = line.split('|').filter((_, ci) => ci > 0 && ci < line.split('|').length - 1);
                          const isHeader = line.includes('---');
                          return (
                            <div key={i} className={`grid grid-cols-${cells.length} gap-2 py-1 ${isHeader ? 'border-b border-[#c5a059]/20' : ''}`}>
                              {cells.map((cell, ci) => (
                                <span key={ci} className={`${isHeader ? 'text-[10px] uppercase tracking-wider text-white/40' : 'text-xs text-white/70'}`}>{cell.trim()}</span>
                              ))}
                            </div>
                          );
                        }
                        if (line.startsWith('- ')) return <div key={i} className="text-xs text-white/70 pl-4 py-0.5">• {line.slice(2)}</div>;
                        if (line.trim() === '') return <div key={i} className="h-2" />;
                        return <p key={i} className="text-xs text-white/70 leading-relaxed">{line}</p>;
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText size={48} className="text-[#c5a059]/30 mb-4" />
                  <p className="text-sm text-white/40 mb-2">Aún no hay informe generado</p>
                  <p className="text-xs text-white/25 max-w-sm">
                    Genera el informe financiero para ver el documento markdown completo aquí.
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                  >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                    Generar Informe
                  </button>
                  {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
