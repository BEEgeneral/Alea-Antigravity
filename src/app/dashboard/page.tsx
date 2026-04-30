"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building, Users, FileText, Radio, TrendingUp, ArrowUpRight,
  ChevronRight, Activity, Target, BarChart3, PieChart
} from "lucide-react";

interface DashboardStats {
  stats: {
    properties: number;
    investors: number;
    documents: number;
    signals: number;
    avgPrice: number | null;
    avgSignalScore: number | null;
    totalPortfolioValue: number | null;
  };
  recentProperties: Array<{
    id: string;
    title: string;
    price: number | null;
    status: string;
    asset_type: string;
    location_hint: string;
    created_at: string;
  }>;
  signalsBySource: Array<{ source: string; count: string; avg_score: string }>;
}

function formatCurrency(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `€${(val / 1_000).toFixed(0)}K`;
  return `€${val.toFixed(0)}`;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5 flex items-start gap-4"
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

function PortfolioBar({ properties, avgPrice }: { properties: number; avgPrice: number | null }) {
  const max = avgPrice || 500_000;
  const segments = [
    { label: "Hoteles", pct: 35, color: "#6366F1" },
    { label: "Comercial", pct: 25, color: "#22D3EE" },
    { label: "Residencial", pct: 20, color: "#A78BFA" },
    { label: "Industrial", pct: 12, color: "#F472B6" },
    { label: "Suelo", pct: 8, color: "#34D399" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-medium text-white">Cartera por tipo</h3>
      </div>
      <div className="flex gap-1 h-40 items-end mb-4">
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ height: 0 }}
            animate={{ height: `${s.pct}%` }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
            className="flex-1 rounded-t-md flex items-end justify-center pb-2"
            style={{ backgroundColor: s.color + "33", borderTop: `2px solid ${s.color}` }}
            title={s.label}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-gray-400 text-xs">{s.label}</span>
            <span className="text-white text-xs ml-auto">{s.pct}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SignalsChart({ signalsBySource }: { signalsBySource: DashboardStats["signalsBySource"] }) {
  const total = signalsBySource.reduce((sum, s) => sum + parseInt(s.count), 0) || 1;
  const colors = ["#6366F1", "#22D3EE", "#34D399", "#F472B6", "#FBBF24"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-6">
        <Radio className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-medium text-white">RADAR — Señales por fuente</h3>
      </div>
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {signalsBySource.length === 0 ? (
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1A1A2E" strokeWidth="12" />
            ) : (
              signalsBySource.map((s, i) => {
                const pct = (parseInt(s.count) / total) * 100;
                const prev = signalsBySource.slice(0, i).reduce((sum, x) => sum + (parseInt(x.count) / total) * 100, 0);
                const dash = (pct / 100) * 251.2;
                const gap = 251.2 - dash;
                return (
                  <circle
                    key={s.source}
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={colors[i % colors.length]}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-((prev / 100) * 251.2)}
                  />
                );
              })
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xl font-bold text-white">{total}</span>
            <span className="text-xs text-gray-400">señales</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {signalsBySource.map((s, i) => (
            <div key={s.source} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-gray-300 text-xs capitalize flex-1">{s.source.replace('_', ' ')}</span>
              <span className="text-white text-xs font-medium">{s.count}</span>
            </div>
          ))}
          {signalsBySource.length === 0 && (
            <span className="text-gray-500 text-xs">Ejecuta el scanner para ver datos</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RecentProperties({ properties }: { properties: DashboardStats["recentProperties"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Building className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-medium text-white">Propiedades recientes</h3>
        <a href="/properties" className="ml-auto text-indigo-400 text-xs flex items-center gap-1 hover:underline">
          Ver todas <ChevronRight className="w-3 h-3" />
        </a>
      </div>
      <div className="flex flex-col gap-3">
        {properties.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Sin propiedades aún</p>
        )}
        {properties.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[#1A1A2E] last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{p.title || "Sin título"}</p>
              <p className="text-gray-500 text-xs">{p.location_hint || "—"} · {p.asset_type || "RESIDENTIAL"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-indigo-300 text-sm font-medium">{formatCurrency(p.price)}</p>
              <p className="text-gray-500 text-xs capitalize">{p.status || "active"}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      fetch("/api/dashboard/stats")
        .then(r => r.json())
        .then(d => { setStats(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats: s } = stats;

  return (
    <div className="min-h-screen bg-[#08080C]">
      {/* Header */}
      <div className="border-b border-[#1A1A2E] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Alea Dashboard</h1>
            <p className="text-gray-400 text-xs">Resumen de actividad — {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Building} label="Propiedades" value={s.properties} sub="en cartera" color="bg-indigo-500/20" />
          <StatCard icon={Users} label="Inversores" value={s.investors} sub="registrados" color="bg-cyan-500/20" />
          <StatCard icon={FileText} label="Documentos" value={s.documents} sub="dossiers" color="bg-pink-500/20" />
          <StatCard icon={Radio} label="Señales RADAR" value={s.signals} sub="detectadas" color="bg-emerald-500/20" />
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="col-span-3 lg:col-span-1 bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Precio medio</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(s.avgPrice)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-3 lg:col-span-1 bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Score RADAR medio</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.avgSignalScore ? s.avgSignalScore.toFixed(1) : "—"}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-3 lg:col-span-1 bg-[#0D0D12] border border-[#1A1A2E] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-pink-400" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Valor cartera</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(s.totalPortfolioValue)}</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <PortfolioBar properties={s.properties} avgPrice={s.avgPrice} />
          <SignalsChart signalsBySource={stats.signalsBySource} />
          <RecentProperties properties={stats.recentProperties} />
        </div>
      </div>
    </div>
  );
}
