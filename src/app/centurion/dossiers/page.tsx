"use client";

import { useEffect, useState } from "react";
import { FileText, FolderOpen, Search, Filter, Download, Upload, Eye, Loader2, ExternalLink } from "lucide-react";

interface Dossier {
    id: string;
    title: string;
    property_id: string;
    file_url: string;
    file_type: string;
    created_at: string;
    uploaded_by: string;
}

export default function DossiersPage() {
    const [dossiers, setDossiers] = useState<Dossier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const fetchDossiers = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                const res = await fetch('/api/dossiers', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setDossiers(data.dossiers || []);
                } else {
                    // Mock data for demo
                    setDossiers([
                        { id: '1', title: 'Chueca Project - Augusto Figueroa 3', property_id: '1', file_url: '#', file_type: 'pdf', created_at: new Date().toISOString(), uploaded_by: 'admin' },
                        { id: '2', title: 'Palacio Gran Vía - Dossier Completo', property_id: '2', file_url: '#', file_type: 'pdf', created_at: new Date().toISOString(), uploaded_by: 'admin' },
                        { id: '3', title: 'Hotel Madrid Centro', property_id: '3', file_url: '#', file_type: 'pdf', created_at: new Date().toISOString(), uploaded_by: 'admin' },
                    ]);
                }
            } catch (err) {
                console.error('Error fetching dossiers:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDossiers();
    }, []);

    const filteredDossiers = dossiers.filter(d => {
        const matchesSearch = d.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || d.file_type === filterType;
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Dossier Manager</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestionar dossiers de propiedades y documentos</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                    <Upload size={18} />
                    <span className="text-sm font-medium">Subir Dossier</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Dossiers</p>
                    <p className="text-2xl font-serif">{dossiers.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PDFs</p>
                    <p className="text-2xl font-serif">{dossiers.filter(d => d.file_type === 'pdf').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Esta Semana</p>
                    <p className="text-2xl font-serif">{dossiers.filter(d => new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Storage</p>
                    <p className="text-2xl font-serif">24.5 MB</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar dossiers..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="px-4 py-2 bg-card border border-border rounded-xl text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">Todos los tipos</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">Word</option>
                    <option value="img">Imagen</option>
                </select>
            </div>

            {/* Dossiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDossiers.map(dossier => (
                    <div key={dossier.id} className="p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <FileText size={24} className="text-primary" />
                            </div>
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] font-bold rounded-md uppercase">
                                {dossier.file_type}
                            </span>
                        </div>
                        
                        <h3 className="font-medium mb-2 line-clamp-2">{dossier.title}</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Subido: {new Date(dossier.created_at).toLocaleDateString('es-ES')}
                        </p>

                        <div className="flex items-center space-x-2 pt-4 border-t border-border/50">
                            <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-all text-sm">
                                <Eye size={16} />
                                <span>Ver</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-all text-sm">
                                <Download size={16} />
                                <span>Descargar</span>
                            </button>
                            <button className="p-2 bg-muted rounded-lg hover:bg-muted/80 transition-all">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDossiers.length === 0 && (
                <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No se encontraron dossiers</p>
                </div>
            )}
        </div>
    );
}