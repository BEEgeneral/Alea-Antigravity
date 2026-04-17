"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, Users, Database, Settings, FileText, Activity, Bell, Webhook,
  AlertTriangle, Home, Brain, Zap, Calendar, Video, Shield, Search,
  TrendingUp, Eye, Loader2, CheckCircle, Clock
} from "lucide-react";

interface Stats {
  totalProfiles: number;
  classifiedInvestors: number;
  pendingOSINT: number;
  completedOSINT: number;
  recentActivity: { id: string; action: string; time: string }[];
}

interface InvestorProfile {
  id: string;
  full_name: string;
  company_name?: string;
  piedra_personalidad?: string;
  scrape_status?: string;
  created_at?: string;
}

export default function CenturionOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalProfiles: 0,
    classifiedInvestors: 0,
    pendingOSINT: 0,
    completedOSINT: 0,
    recentActivity: []
  });
  const [recentProfiles, setRecentProfiles] = useState<InvestorProfile[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('insforge_token');
      if (!token) return;

      // Load profiles
      const profilesRes = await fetch('/api/centurion?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profilesData = await profilesRes.json();
      const profiles = profilesData.profiles || [];

      // Load classifications
      const classRes = await fetch('/api/classify-investor?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const classData = await classRes.json();
      const classifications = classData.classifications || [];

      const completed = profiles.filter((p: any) => p.scrape_status === 'completed').length;
      const pending = profiles.filter((p: any) => p.scrape_status === 'pending' || p.scrape_status === 'in_progress').length;

      setStats({
        totalProfiles: profiles.length,
        classifiedInvestors: classifications.length,
        pendingOSINT: pending,
        completedOSINT: completed,
        recentActivity: [
          { id: '1', action: 'Nuevo perfil detectado: María González', time: 'Hace 5 min' },
          { id: '2', action: 'Clasificación completada: Carlos Ruiz (Zafiro)', time: 'Hace 15 min' },
          { id: '3', action: 'OSINT finalizado: Pedro Sánchez', time: 'Hace 1 hora' },
          { id: '4', action: 'Nuevo inversor clasificado: Elena Torres (Rubí)', time: 'Hace 2 horas' },
        ]
      });

      setRecentProfiles(profiles.slice(0, 8));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const piedraEmojis: Record<string, string> = {
    ZAFIRO: '💎',
    PERLA: '🔮',
    ESMERALDA: '💚',
    RUBI: '❤️'
  };

  const piedraColors: Record<string, string> = {
    ZAFIRO: 'border-blue-500/30 bg-blue-500/5',
    PERLA: 'border-purple-500/30 bg-purple-500/5',
    ESMERALDA: 'border-emerald-500/30 bg-emerald-500/5',
    RUBI: 'border-red-500/30 bg-red-500/5'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando Centro de Inteligencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium">Centro de Inteligencia Alea</h1>
              <p className="text-muted-foreground">Panel de control y análisis de inversores</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold">{stats.totalProfiles}</span>
            </div>
            <p className="text-sm text-muted-foreground">Perfiles OSINT</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold">{stats.completedOSINT}</span>
            </div>
            <p className="text-sm text-muted-foreground">Búsquedas Completadas</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-2xl font-bold">{stats.pendingOSINT}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-2xl font-bold">{stats.classifiedInvestors}</span>
            </div>
            <p className="text-sm text-muted-foreground">Clasificados</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Profiles */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-medium">Perfiles Recientes</h2>
              <a href="/centrion/dossiers" className="text-sm text-primary hover:underline">
                Ver todos →
              </a>
            </div>
            
            <div className="space-y-3">
              {recentProfiles.length > 0 ? recentProfiles.map((profile) => (
                <div 
                  key={profile.id}
                  className={`p-4 rounded-xl border ${profile.piedra_personalidad ? piedraColors[profile.piedra_personalidad] : 'border-border'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{profile.full_name}</p>
                      {profile.company_name && (
                        <p className="text-sm text-muted-foreground">{profile.company_name}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {profile.piedra_personalidad && (
                        <span className="text-2xl">{piedraEmojis[profile.piedra_personalidad]}</span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        profile.scrape_status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {profile.scrape_status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay perfiles aún</p>
                  <a 
                    href="/centrion/dossiers"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Crear primera búsqueda →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-serif font-medium mb-6">Actividad Reciente</h2>
            
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Piedras Preciosas Quick Reference */}
        <div className="mt-8 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-serif font-medium mb-4">Guía Rápida: Piedras Preciosas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">💎</span>
                <span className="font-bold text-blue-500">Zafiro</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Motivación: Diversión</p>
              <p className="text-xs">Sociable, competitivo, Historias, tono casual</p>
            </div>

            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🔮</span>
                <span className="font-bold text-purple-500">Perla</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Motivación: Causa</p>
              <p className="text-xs">Leal, calmado, Escuchar, toque personal</p>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">💚</span>
                <span className="font-bold text-emerald-500">Esmeralda</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Motivación: Análisis</p>
              <p className="text-xs">Detallado, puntual, Datos, proceso</p>
            </div>

            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">❤️</span>
                <span className="font-bold text-red-500">Rubí</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Motivación: Desafío</p>
              <p className="text-xs">Competitivo, ambicioso, Resultados, velocidad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}