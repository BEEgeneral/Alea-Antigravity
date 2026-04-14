'use client';

import { useState, useEffect } from 'react';
import { 
    Brain, Search, Plus, Trash2, ChevronRight, ChevronDown, 
    Clock, MessageSquare, Target, Lightbulb, Heart, HelpCircle,
    Loader2, X, Save, FolderOpen, Network
} from 'lucide-react';

interface MemoryWing {
    id: string;
    name: string;
    wing_type: string;
    entity_id?: string;
    description?: string;
    keywords: string[];
    created_at: string;
    updated_at: string;
}

interface MemoryRoom {
    id: string;
    wing_id: string;
    name: string;
    hall_type: string;
    description?: string;
}

interface MemoryDrawer {
    id: string;
    room_id: string;
    content: string;
    content_type: string;
    source?: string;
    importance_score: number;
    created_at: string;
}

interface KnowledgeTriple {
    id: string;
    entity_subject: string;
    relationship: string;
    entity_object: string;
    valid_from: string;
    valid_until?: string;
    confidence_score: number;
}

const HALL_ICONS: Record<string, React.ReactNode> = {
    facts: <Target size={14} className="text-emerald-500" />,
    events: <Clock size={14} className="text-blue-500" />,
    discoveries: <Lightbulb size={14} className="text-amber-500" />,
    preferences: <Heart size={14} className="text-red-500" />,
    advice: <HelpCircle size={14} className="text-purple-500" />,
    conversations: <MessageSquare size={14} className="text-gray-500" />,
    decisions: <Target size={14} className="text-emerald-500" />,
};

const HALL_COLORS: Record<string, string> = {
    facts: 'bg-emerald-500/10 border-emerald-500/20',
    events: 'bg-blue-500/10 border-blue-500/20',
    discoveries: 'bg-amber-500/10 border-amber-500/20',
    preferences: 'bg-red-500/10 border-red-500/20',
    advice: 'bg-purple-500/10 border-purple-500/20',
    conversations: 'bg-gray-500/10 border-gray-500/20',
    decisions: 'bg-emerald-500/10 border-emerald-500/20',
};

export default function MemoryPanel() {
    const [wings, setWings] = useState<MemoryWing[]>([]);
    const [selectedWing, setSelectedWing] = useState<MemoryWing | null>(null);
    const [rooms, setRooms] = useState<MemoryRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<MemoryRoom | null>(null);
    const [drawers, setDrawers] = useState<MemoryDrawer[]>([]);
    const [triples, setTriples] = useState<KnowledgeTriple[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MemoryDrawer[]>([]);
    const [activeTab, setActiveTab] = useState<'wings' | 'search' | 'knowledge'>('wings');
    const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
    const [isAddingMemory, setIsAddingMemory] = useState(false);
    const [newMemory, setNewMemory] = useState({ roomName: '', hallType: 'events', content: '' });
    const [selectedInvestor, setSelectedInvestor] = useState('');

    useEffect(() => {
        fetchWings();
    }, []);

    useEffect(() => {
        if (selectedWing) {
            fetchRooms(selectedWing.id);
            fetchKnowledgeGraph(selectedWing.name);
        }
    }, [selectedWing]);

    useEffect(() => {
        if (selectedRoom) {
            fetchDrawers(selectedRoom.id);
        }
    }, [selectedRoom]);

    const fetchWings = async () => {
        try {
            const res = await fetch('/api/memory?action=list_wings');
            const data = await res.json();
            setWings(data.wings || []);
        } catch (e) {
            console.error('Error fetching wings:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async (wingId: string) => {
        try {
            const res = await fetch(`/api/memory?action=get_rooms&wingId=${wingId}`);
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (e) {
            console.error('Error fetching rooms:', e);
        }
    };

    const fetchDrawers = async (roomId: string) => {
        try {
            const res = await fetch(`/api/memory?action=get_drawers&roomId=${roomId}&limit=50`);
            const data = await res.json();
            setDrawers(data.drawers || []);
        } catch (e) {
            console.error('Error fetching drawers:', e);
        }
    };

    const fetchKnowledgeGraph = async (wingName: string) => {
        try {
            const entity = wingName.replace('investor_', '');
            const res = await fetch(`/api/memory?action=query_kg&entity=${entity}`);
            const data = await res.json();
            setTriples(data.triples || []);
        } catch (e) {
            console.error('Error fetching knowledge graph:', e);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const res = await fetch(`/api/memory?action=search&query=${encodeURIComponent(searchQuery)}&limit=20`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (e) {
            console.error('Error searching:', e);
        }
    };

    const handleAddMemory = async () => {
        if (!selectedWing || !newMemory.roomName || !newMemory.content) return;
        
        try {
            await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_memory',
                    wingName: selectedWing.name,
                    roomName: newMemory.roomName,
                    hallType: newMemory.hallType,
                    content: newMemory.content,
                    source: 'manual'
                })
            });
            
            setIsAddingMemory(false);
            setNewMemory({ roomName: '', hallType: 'events', content: '' });
            
            if (selectedWing) {
                fetchRooms(selectedWing.id);
            }
        } catch (e) {
            console.error('Error adding memory:', e);
        }
    };

    const handleDeleteDrawer = async (drawerId: string) => {
        if (!confirm('¿Eliminar este recuerdo?')) return;
        
        try {
            await fetch(`/api/memory?drawerId=${drawerId}`, { method: 'DELETE' });
            if (selectedRoom) {
                fetchDrawers(selectedRoom.id);
            }
        } catch (e) {
            console.error('Error deleting drawer:', e);
        }
    };

    const handleInvestorSearch = async () => {
        if (!selectedInvestor.trim()) return;
        
        try {
            const res = await fetch(`/api/memory?action=investor_wing&investorId=${selectedInvestor}&limit=20`);
            const data = await res.json();
            
            if (data.wingName) {
                const wing = data.wings?.[0];
                if (wing) {
                    setSelectedWing(wing);
                }
            }
        } catch (e) {
            console.error('Error searching investor:', e);
        }
    };

    const toggleRoom = (roomId: string) => {
        const newExpanded = new Set(expandedRooms);
        if (newExpanded.has(roomId)) {
            newExpanded.delete(roomId);
        } else {
            newExpanded.add(roomId);
        }
        setExpandedRooms(newExpanded);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto w-full p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-medium flex items-center gap-3">
                        <Brain className="w-8 h-8 text-primary" />
                        Alea Memory Palace
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Sistema de memoria Persistente - Wing → Room → Drawer
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border">
                <button
                    onClick={() => setActiveTab('wings')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'wings' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <FolderOpen className="w-4 h-4 inline mr-2" />
                    Wings
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'search' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Search className="w-4 h-4 inline mr-2" />
                    Buscar
                </button>
                <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'knowledge' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Network className="w-4 h-4 inline mr-2" />
                    Knowledge Graph
                </button>
            </div>

            {activeTab === 'wings' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Wings List */}
                    <div className="space-y-4">
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <h3 className="font-medium mb-4 flex items-center gap-2">
                                <FolderOpen size={16} className="text-primary" />
                                Wings ({wings.length})
                            </h3>
                            
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {wings.map(wing => (
                                    <button
                                        key={wing.id}
                                        onClick={() => setSelectedWing(wing)}
                                        className={`w-full text-left p-3 rounded-xl transition-all ${
                                            selectedWing?.id === wing.id 
                                                ? 'bg-primary/10 border border-primary/30' 
                                                : 'hover:bg-muted border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{wing.name}</span>
                                            <span className="text-xs text-muted-foreground">{wing.wing_type}</span>
                                        </div>
                                        {wing.keywords && wing.keywords.length > 0 && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {wing.keywords.slice(0, 3).map(k => (
                                                    <span key={k} className="text-[10px] px-2 py-0.5 bg-muted rounded-full">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Investor Search */}
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <h3 className="font-medium mb-4">Buscar Inversor</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="ID o email del inversor"
                                    value={selectedInvestor}
                                    onChange={e => setSelectedInvestor(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm border border-border"
                                />
                                <button
                                    onClick={handleInvestorSearch}
                                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg"
                                >
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rooms & Drawers */}
                    <div className="lg:col-span-2 space-y-4">
                        {selectedWing ? (
                            <>
                                <div className="bg-card border border-border rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-serif text-xl font-medium">{selectedWing.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedWing.wing_type} • Creado {formatDate(selectedWing.created_at)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsAddingMemory(true)}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            Añadir Recuerdo
                                        </button>
                                    </div>
                                </div>

                                {/* Add Memory Form */}
                                {isAddingMemory && (
                                    <div className="bg-card border border-border rounded-2xl p-6">
                                        <h4 className="font-medium mb-4">Nuevo Recuerdo</h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Sala</label>
                                                    <input
                                                        type="text"
                                                        value={newMemory.roomName}
                                                        onChange={e => setNewMemory({...newMemory, roomName: e.target.value})}
                                                        placeholder="ej: presupuesto"
                                                        className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                                                    <select
                                                        value={newMemory.hallType}
                                                        onChange={e => setNewMemory({...newMemory, hallType: e.target.value})}
                                                        className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border"
                                                    >
                                                        <option value="facts">Facts (Decisiones)</option>
                                                        <option value="events">Events (Eventos)</option>
                                                        <option value="discoveries">Discoveries (Descubrimientos)</option>
                                                        <option value="preferences">Preferences (Preferencias)</option>
                                                        <option value="advice">Advice (Consejos)</option>
                                                        <option value="conversations">Conversations</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Contenido</label>
                                                <textarea
                                                    value={newMemory.content}
                                                    onChange={e => setNewMemory({...newMemory, content: e.target.value})}
                                                    placeholder="Escribe el recuerdo..."
                                                    rows={4}
                                                    className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border resize-none"
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setIsAddingMemory(false)}
                                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleAddMemory}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Save size={16} />
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Rooms */}
                                <div className="space-y-3">
                                    {rooms.map(room => {
                                        const isExpanded = expandedRooms.has(room.id);
                                        const roomDrawers = selectedRoom?.id === room.id ? drawers : [];
                                        
                                        return (
                                            <div 
                                                key={room.id} 
                                                className={`bg-card border border-border rounded-2xl overflow-hidden ${HALL_COLORS[room.hall_type] || ''}`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        toggleRoom(room.id);
                                                        setSelectedRoom(isExpanded ? null : room);
                                                    }}
                                                    className="w-full p-4 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {HALL_ICONS[room.hall_type] || <MessageSquare size={14} />}
                                                        <div className="text-left">
                                                            <span className="font-medium">{room.name}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                ({room.hall_type})
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                                
                                                {isExpanded && (
                                                    <div className="border-t border-border p-4 space-y-3">
                                                        {roomDrawers.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                                No hay recuerdos en esta sala
                                                            </p>
                                                        ) : (
                                                            roomDrawers.map(drawer => (
                                                                <div 
                                                                    key={drawer.id}
                                                                    className="p-3 bg-muted/50 rounded-xl relative group"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1">
                                                                            <p className="text-sm whitespace-pre-wrap">{drawer.content}</p>
                                                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                                                <span>{formatDate(drawer.created_at)}</span>
                                                                                {drawer.source && (
                                                                                    <span className="px-2 py-0.5 bg-muted rounded-full">
                                                                                        {drawer.source}
                                                                                    </span>
                                                                                )}
                                                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                                                                    Score: {drawer.importance_score}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDeleteDrawer(drawer.id)}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                                <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">
                                    Selecciona un wing para ver sus salas y recuerdos
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'search' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-medium mb-4">Buscar en Memoria</h3>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Buscar recuerdos..."
                                className="flex-1 px-4 py-3 bg-muted rounded-xl border border-border"
                            />
                            <button
                                onClick={handleSearch}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                                {searchResults.length} resultados encontrados
                            </h4>
                            {searchResults.map((result: any) => (
                                <div key={result.id} className="bg-card border border-border rounded-2xl p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {HALL_ICONS[result.room?.hall_type] || <MessageSquare size={14} />}
                                                <span className="text-xs text-muted-foreground">
                                                    {result.room?.wing?.name} / {result.room?.name}
                                                </span>
                                            </div>
                                            <p className="text-sm">{result.content}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {formatDate(result.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'knowledge' && (
                <div className="space-y-6">
                    {selectedWing ? (
                        <>
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <h3 className="font-medium mb-4 flex items-center gap-2">
                                    <Network size={18} className="text-primary" />
                                    Knowledge Graph - {selectedWing.name}
                                </h3>
                                
                                {triples.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No hay conocimiento relaciones para este wing
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {triples.map(triple => (
                                            <div key={triple.id} className="p-4 bg-muted/50 rounded-xl">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="font-medium text-primary">{triple.entity_subject}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs">
                                                        {triple.relationship}
                                                    </span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="font-medium">{triple.entity_object}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>Desde: {formatDate(triple.valid_from)}</span>
                                                    {triple.valid_until && (
                                                        <span>Hasta: {formatDate(triple.valid_until)}</span>
                                                    )}
                                                    <span className="px-2 py-0.5 bg-muted rounded-full">
                                                        Confianza: {triple.confidence_score}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-12 text-center">
                            <Network className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">
                                Selecciona un wing para ver su Knowledge Graph
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
