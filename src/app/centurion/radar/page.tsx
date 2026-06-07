"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Radar,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Filter,
  X,
  ExternalLink,
  Shield,
} from "lucide-react";

type SignalSource = "boe" | "concursos" | "boletin_urbanistico" | "network" | "manual";
type SignalStatus = "detected" | "reviewed" | "dismissed" | "contacted";

interface ScannedSignal {
  id?: string;
  source: SignalSource;
  source_url?: string;
  source_reference?: string;
  title: string;
  asset_type: string;
  location_hint: string;
  address?: string;
  price?: number;
  price_raw?: string;
  meters?: number;
  vendor_name?: string;
  description?: string;
  alea_score?: number;
  score_classification?: string;
  status?: SignalStatus;
  detected_at?: string;
  created_at?: string;
  raw_data?: Record<string, unknown>;
}

interface ScannerStatus {
  scanner_version: string;
  last_run?: string;
  total_signals: number;
  sources: Record<
    string,
    { total: number; high_score: number; last_24h: number }
  >;
}

interface ScanResult {
  source: string;
  signals_found: number;
  signals_created: number;
  errors: string[];
  duration_ms: number;
}

const SOURCE_LABELS: Record<SignalSource, string> = {
  boe: "BOE",
  concursos: "Concursos",
  boletin_urbanistico: "Boletín",
  network: "Network",
  manual: "Manual",
};

const SOURCE_COLORS: Record<SignalSource, string> = {
  boe: "border-l-blue-500",
  concursos: "border-l-purple-500",
  boletin_urbanistico: "border-l-amber-500",
  network: "border-l-emerald-500",
  manual: "border-l-gray-500",
};

const SOURCE_BG: Record<SignalSource, string> = {
  boe: "bg-blue-500/10 text-blue-400",
  concursos: "bg-purple-500/10 text-purple-400",
  boletin_urbanistico: "bg-amber-500/10 text-amber-400",
  network: "bg-emerald-500/10 text-emerald-400",
  manual: "bg-gray-500/10 text-gray-400",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  exceptional: "bg-red-500/10 text-red-400 border border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  low: "bg-muted/10 text-muted-foreground border border-border",
};

export default function CentrionRadarPage() {
  const [signals, setSignals] = useState<ScannedSignal[]>([]);
  const [stats, setStats] = useState<ScannerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    summary?: {
      total_signals_found: number;
      total_signals_created: number;
      sources_scanned: number;
      errors: number;
    };
    results?: ScanResult[];
    scanned_at?: string;
  } | null>(null);

  // Filters
  const [filterSource, setFilterSource] = useState<SignalSource | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSource !== "all") params.set("source", filterSource);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (minScore) params.set("minScore", minScore);
      params.set("limit", "100");

      const res = await fetch(`/api/radar/scan?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
        setStats({
          scanner_version: data.scanner_version || "2.0.0",
          total_signals: data.total_signals || data.signals?.length || 0,
          sources: data.sources || {},
        });
      }
    } catch (e) {
      console.error("Failed to fetch signals:", e);
    } finally {
      setLoading(false);
    }
  }, [filterSource, filterStatus, minScore]);

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const token = localStorage.getItem("insforge_token");
      const res = await fetch("/api/radar/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.success) {
        await fetchSignals();
      }
    } catch (e) {
      setScanResult({
        success: false,
      });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const filteredSignals = signals;

  const totalHighScore = Object.values(stats?.sources || {}).reduce(
    (sum, s) => sum + (s.high_score || 0),
    0
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Nunca";
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Radar size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-medium">RADAR Alea</h1>
                <p className="text-sm text-muted-foreground">
                  Inteligencia de fuentes públicas — v{stats?.scanner_version || "2.0.0"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchSignals}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-all text-sm"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                <span>Actualizar</span>
              </button>
              <button
                onClick={runScan}
                disabled={scanning}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-all disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Escaneando...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result Toast */}
      {scanResult && (
        <div
          className={`mx-8 mt-6 px-6 py-4 rounded-2xl border flex items-center space-x-4 ${
            scanResult.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {scanResult.success ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <div className="flex-1">
            {scanResult.success ? (
              <p className="text-sm font-medium">
                Scan completado — {scanResult.summary?.total_signals_found || 0} señales encontradas,{" "}
                {scanResult.summary?.total_signals_created || 0} creadas.{" "}
                {scanResult.scanned_at && `at ${formatDate(scanResult.scanned_at)}`}
              </p>
            ) : (
              <p className="text-sm font-medium">Scan fallido. Revisa los logs.</p>
            )}
          </div>
          <button onClick={() => setScanResult(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="p-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card/50 border border-border/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Total Señales
              </span>
              <Radar size={16} className="text-primary/60" />
            </div>
            <p className="text-3xl font-serif font-bold">{stats?.total_signals || 0}</p>
          </div>

          <div className="bg-card/50 border border-border/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                High Score
              </span>
              <TrendingUp size={16} className="text-orange-400/60" />
            </div>
            <p className="text-3xl font-serif font-bold text-orange-400">{totalHighScore}</p>
          </div>

          {(Object.entries(stats?.sources || {}) as [SignalSource, { total: number; high_score: number; last_24h: number }][]).map(
            ([src, data]) => (
              <div
                key={src}
                className={`bg-card/50 border-l-4 ${SOURCE_COLORS[src]} border border-border/50 rounded-2xl p-6`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    {SOURCE_LABELS[src]}
                  </span>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SOURCE_BG[src]}`}>
                    {data.total}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-orange-400 font-medium">{data.high_score}</span> alta score
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {data.last_24h} últimas 24h
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Filters */}
        <div className="bg-card/30 border border-border/50 rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Filtros
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Fuente</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as SignalSource | "all")}
                className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="all">Todas</option>
                <option value="boe">BOE</option>
                <option value="concursos">Concursos</option>
                <option value="boletin_urbanistico">Boletín Urbanístico</option>
                <option value="network">Network</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="all">Todos</option>
                <option value="detected">Detectado</option>
                <option value="reviewed">Revisado</option>
                <option value="dismissed">Descartado</option>
                <option value="contacted">Contactado</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Score Mín.
              </label>
              <input
                type="number"
                placeholder="0"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                min={0}
                max={100}
                className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-24"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchSignals}
                className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Signals List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-primary/40" />
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-3xl">
            <Radar size={40} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold">
              No se detectaron señales
            </p>
            <p className="text-muted-foreground/50 text-xs mt-2">
              Ejecuta un scan para comenzar a detectar oportunidades.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal, idx) => {
              const score = signal.alea_score ?? 0;
              const classification = signal.score_classification || "low";
              const sourceColor = SOURCE_COLORS[signal.source as SignalSource] || "border-l-gray-500";
              const sourceBg = SOURCE_BG[signal.source as SignalSource] || "bg-gray-500/10 text-gray-400";
              const scoreColor = score >= 65 ? "text-orange-400" : score >= 45 ? "text-yellow-400" : "text-muted-foreground";

              return (
                <div
                  key={signal.id || idx}
                  className={`bg-card/50 border border-border/50 border-l-4 ${sourceColor} rounded-2xl p-6 hover:border-border transition-all`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Title and source badge */}
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sourceBg}`}
                        >
                          {SOURCE_LABELS[signal.source as SignalSource] || signal.source}
                        </span>
                        {signal.asset_type && (
                          <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                            {signal.asset_type}
                          </span>
                        )}
                        {classification && classification !== "low" && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              CLASSIFICATION_COLORS[classification] || CLASSIFICATION_COLORS.low
                            }`}
                          >
                            {classification}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-medium mb-1 line-clamp-2">{signal.title}</h3>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
                        {signal.location_hint && (
                          <span className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span>{signal.location_hint}</span>
                          </span>
                        )}
                        {signal.price && (
                          <span className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span>€{signal.price.toLocaleString("es-ES")}</span>
                          </span>
                        )}
                        {signal.meters && (
                          <span className="flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span>{signal.meters}m²</span>
                          </span>
                        )}
                        {signal.detected_at && (
                          <span className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{formatDate(signal.detected_at)}</span>
                          </span>
                        )}
                        {signal.created_at && !signal.detected_at && (
                          <span className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{formatDate(signal.created_at)}</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {signal.description && (
                        <p className="text-sm text-muted-foreground/80 mt-3 line-clamp-2">
                          {signal.description}
                        </p>
                      )}
                    </div>

                    {/* Right side: score + status */}
                    <div className="flex flex-col items-end space-y-3 shrink-0">
                      <div className="text-right">
                        <div className={`text-2xl font-serif font-bold ${scoreColor}`}>
                          {score}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          Alea Score
                        </div>
                      </div>

                      {signal.status && (
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            signal.status === "detected"
                              ? "bg-blue-500/10 text-blue-400"
                              : signal.status === "reviewed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : signal.status === "contacted"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/10 text-muted-foreground"
                          }`}
                        >
                          {signal.status}
                        </span>
                      )}

                      {signal.source_url && (
                        <a
                          href={signal.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink size={12} />
                          <span>Ver Fuente</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
