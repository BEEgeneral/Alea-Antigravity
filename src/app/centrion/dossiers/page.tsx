"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Building, User, Shield, Loader2, ExternalLink, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface InvestorProfile {
  id: string;
  full_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  google_results?: string;
  personality_summary?: string;
  scrape_status?: string;
  piedra_personalidad?: string;
  disc_profile?: string;
  investor_type?: string;
  risk_profile?: string;
  classification_data?: any;
  created_at?: string;
}

interface Classification {
  id: string;
  investor_name: string;
  piedra_primaria: string;
  disc_profile: string;
  investor_type: string;
  risk_profile: string;
  confidence_score?: number;
  created_at?: string;
}

const PIEDRA_INFO = {
  ZAFIRO: { emoji: '💎', color: 'blue', strategy: 'Mantenerlo sencillo, historias, tono casual, crear visión' },
  PERLA: { emoji: '🔮', color: 'purple', strategy: 'Escuchar, apoyar, toque personal, explicar cómo ayuda a familia' },
  ESMERALDA: { emoji: '💚', color: 'emerald', strategy: 'Datos, proceso, validar, hablar de integridad y ahorro' },
  RUBI: { emoji: '❤️', color: 'red', strategy: 'Rápido, resultados, precisión, mencionar sus metas' }
};

export default function DossiersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [profiles, setProfiles] = useState<InvestorProfile[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<InvestorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"osint" | "classifications">("osint");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('insforge_token');
        if (!token) return;
        
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.profile);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadProfiles();
      loadClassifications();
    }
  }, [currentUser]);

  const handleOSINTSearch = async () => {
    if (!searchName.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('insforge_token');

      // Create centurion profile
      const createRes = await fetch('/api/centurion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: `${searchName} ${searchCompany || ''}`,
          sourceType: 'osint_search',
          createdBy: currentUser?.id
        })
      });

      const createData = await createRes.json();
      let profileId = createData.created?.[0]?.id;

      if (!profileId && createData.existing?.[0]?.id) {
        profileId = createData.existing[0].id;
      }

      // Trigger OSINT scrape
      if (profileId) {
        await fetch('/api/centurion-scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            profileId,
            name: searchName,
            company: searchCompany || undefined
          })
        });

        const refreshRes = await fetch(`/api/centurion-scrape?profileId=${profileId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshData.profile) {
          setSelectedProfile(refreshData.profile);
        }
      }

      // Classify investor
      if (searchName) {
        await fetch('/api/classify-investor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: searchName,
            company: searchCompany || undefined,
            triggerOSINT: !!profileId
          })
        });
      }

      loadProfiles();
      loadClassifications();

    } catch (error) {
      console.error('OSINT search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch('/api/centrion?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Load profiles error:', error);
    }
  };

  const loadClassifications = async () => {
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch('/api/classify-investor?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setClassifications(data.classifications || []);
    } catch (error) {
      console.error('Load classifications error:', error);
    }
  };

  const piedraColors: Record<string, string> = {
    ZAFIRO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    PERLA: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    ESMERALDA: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    RUBI: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium mb-2">Centro de Inteligencia del Inversor</h1>
          <p className="text-muted-foreground">
            Análisis OSINT + Clasificación según metodología "Piedras Preciosas" (Zafiro, Perla, Esmeralda, Rubí)
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("osint")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "osint"
                ? "bg-primary text-white"
                : "bg-card border border-border hover:border-primary/50"
            }`}
          >
            <Search className="inline mr-2 w-4 h-4" />
            Búsqueda OSINT
          </button>
          <button
            onClick={() => {
              setActiveTab("classifications");
              loadClassifications();
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "classifications"
                ? "bg-primary text-white"
                : "bg-card border border-border hover:border-primary/50"
            }`}
          >
            <FileText className="inline mr-2 w-4 h-4" />
            Clasificaciones Guardadas
          </button>
        </div>

        {activeTab === "osint" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Search Panel */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-serif font-medium mb-4">Nueva Búsqueda OSINT</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Nombre completo</label>
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Ej: Juan García López"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Empresa (opcional)</label>
                    <input
                      type="text"
                      value={searchCompany}
                      onChange={(e) => setSearchCompany(e.target.value)}
                      placeholder="Ej: Goldman Sachs"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={handleOSINTSearch}
                    disabled={!searchName.trim() || isSearching}
                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                        Buscando en internet...
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 w-4 h-4" />
                        Buscar y Clasificar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Profiles */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-serif font-medium mb-4">Perfiles Detectados</h2>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        selectedProfile?.id === profile.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{profile.full_name}</p>
                          {profile.company_name && (
                            <p className="text-sm text-muted-foreground">{profile.company_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {profile.piedra_personalidad && (
                            <span className="text-lg">{PIEDRA_INFO[profile.piedra_personalidad as keyof typeof PIEDRA_INFO]?.emoji}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.scrape_status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : profile.scrape_status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {profile.scrape_status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {profiles.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay perfiles aún. Realiza una búsqueda.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Results Panel - Investor Profile Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-serif font-medium mb-4">Ficha del Inversor</h2>
              
              {selectedProfile ? (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-2xl">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-medium">{selectedProfile.full_name}</h3>
                      {selectedProfile.company_name && (
                        <p className="text-lg text-muted-foreground">{selectedProfile.company_name}</p>
                      )}
                      {selectedProfile.email && (
                        <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Personality Classification */}
                  {selectedProfile.piedra_personalidad && (
                    <div className={`p-6 rounded-2xl border-2 ${piedraColors[selectedProfile.piedra_personalidad] || 'bg-muted'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl">{PIEDRA_INFO[selectedProfile.piedra_personalidad as keyof typeof PIEDRA_INFO]?.emoji}</span>
                          <div>
                            <h4 className="text-xl font-bold">Piedra: {selectedProfile.piedra_personalidad}</h4>
                            <p className="text-sm opacity-70">DISC: {selectedProfile.disc_profile}</p>
                          </div>
                        </div>
                        {selectedProfile.scrape_status === 'completed' && (
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        )}
                      </div>
                      <div className="mt-4 p-4 bg-black/10 rounded-xl">
                        <p className="text-sm font-medium mb-2">Estrategia de Cierre:</p>
                        <p className="text-sm">{PIEDRA_INFO[selectedProfile.piedra_personalidad as keyof typeof PIEDRA_INFO]?.strategy}</p>
                      </div>
                    </div>
                  )}

                  {/* Investor Type */}
                  {selectedProfile.investor_type && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Tipo de Inversor</p>
                        <p className="font-medium">{selectedProfile.investor_type.replace('_', ' ')}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Perfil de Riesgo</p>
                        <p className={`font-medium ${
                          selectedProfile.risk_profile === 'conservative' ? 'text-blue-500' :
                          selectedProfile.risk_profile === 'moderate' ? 'text-amber-500' :
                          'text-red-500'
                        }`}>
                          {selectedProfile.risk_profile}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Presencia en Redes</h4>
                    
                    {selectedProfile.linkedin_url ? (
                      <a
                        href={selectedProfile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all"
                      >
                        <span className="text-blue-500 font-bold">in</span>
                        <span className="font-medium text-blue-500">LinkedIn</span>
                        <ExternalLink className="w-4 h-4 ml-auto text-blue-500/50" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-xl text-muted-foreground">
                        <span className="text-blue-500 font-bold">in</span>
                        <span>LinkedIn no encontrado</span>
                        <AlertCircle className="w-4 h-4 ml-auto" />
                      </div>
                    )}
                    
                    {selectedProfile.twitter_url ? (
                      <a
                        href={selectedProfile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl hover:bg-sky-500/20 transition-all"
                      >
                        <span className="text-sky-500 font-bold">X</span>
                        <span className="font-medium text-sky-500">Twitter / X</span>
                        <ExternalLink className="w-4 h-4 ml-auto text-sky-500/50" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-xl text-muted-foreground">
                        <span className="text-sky-500 font-bold">X</span>
                        <span>Twitter no encontrado</span>
                        <AlertCircle className="w-4 h-4 ml-auto" />
                      </div>
                    )}
                    
                    {selectedProfile.website_url ? (
                      <a
                        href={selectedProfile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
                      >
                        <Building className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium text-emerald-500">Website</span>
                        <ExternalLink className="w-4 h-4 ml-auto text-emerald-500/50" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-xl text-muted-foreground">
                        <Building className="w-5 h-5" />
                        <span>Website no encontrado</span>
                        <AlertCircle className="w-4 h-4 ml-auto" />
                      </div>
                    )}
                  </div>

                  {/* Personality Summary from OSINT */}
                  {selectedProfile.personality_summary && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <h4 className="text-sm font-medium mb-2">📋 Resumen de Personalidad (OSINT)</h4>
                      <p className="text-sm text-muted-foreground">{selectedProfile.personality_summary}</p>
                    </div>
                  )}

                  {/* Google Results Raw */}
                  {selectedProfile.google_results && (
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground p-2">
                        Ver resultados de Google ({selectedProfile.google_results.split('\n').length} URLs)
                      </summary>
                      <div className="mt-2 p-4 bg-muted rounded-xl text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {selectedProfile.google_results}
                      </div>
                    </details>
                  )}

                  {/* No data state */}
                  {!selectedProfile.linkedin_url && !selectedProfile.twitter_url && !selectedProfile.website_url && 
                   !selectedProfile.personality_summary && !selectedProfile.piedra_personalidad && (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {selectedProfile.scrape_status === 'in_progress'
                          ? '🔄 Búsqueda en progreso...'
                          : selectedProfile.scrape_status === 'pending'
                          ? '⏳ Búsqueda pendiente'
                          : 'No se encontraron resultados públicos'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona un perfil o realiza una nueva búsqueda
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Classifications Tab */
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-serif font-medium mb-4">Clasificaciones Guardadas</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Piedra</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">DISC</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Riesgo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {classifications.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{c.investor_name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${piedraColors[c.piedra_primaria] || 'bg-muted'}`}>
                          {PIEDRA_INFO[c.piedra_primaria as keyof typeof PIEDRA_INFO]?.emoji} {c.piedra_primaria}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-muted rounded text-sm font-mono">{c.disc_profile}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{c.investor_type?.replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          c.risk_profile === 'conservative' ? 'bg-blue-500/10 text-blue-500' :
                          c.risk_profile === 'moderate' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {c.risk_profile}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.confidence_score ? (
                          <span className="text-sm">{(c.confidence_score * 100).toFixed(0)}%</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {classifications.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay clasificaciones aún. Los inversores se clasificarán automáticamente cuando se detecten.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}