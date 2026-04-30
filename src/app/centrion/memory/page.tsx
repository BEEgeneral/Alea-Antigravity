"use client";

import { useState, useEffect } from "react";
import { Brain, Search, Plus, Trash2, ChevronRight, ChevronDown, Clock, MessageSquare, Target, Lightbulb, Heart, HelpCircle, Loader2, FolderOpen, Network, Save } from "lucide-react";

interface MemoryWing {
    id: string;
    name: string;
    wing_type: string;
    entity_id?: string;
    description?: string;
    keywords: string[];
    created_at: string;
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
}

interface KnowledgeTriple {
    id: string;
    entity_subject: string;
    relationship: string;
    entity_object: string;
    confidence_score: number;
}

const HALL_ICONS: Record<string, React.ReactNode> = {
    facts: <Target size={14} className="text-emerald-500" />,
    conversations: <MessageSquare size={14} className="text-blue-500" />,
    insights: <Lightbulb size={14} className="text-amber-500" />,
    emotional: <Heart size={14} className="text-red-500" />,
    questions: <HelpCircle size={14} className="text-purple-500" />,
};

export default function MemoryPage() {
    const [wings, setWings] = useState<MemoryWing[]>([]);
    const [rooms, setRooms] = useState<MemoryRoom[]>([]);
    const [drawers, setDrawers] = useState<MemoryDrawer[]>([]);
    const [triples, setTriples] = useState<KnowledgeTriple[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedWings, setExpandedWings] = useState<Set<string>>(new Set());
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'wings' | 'graph' | 'search'>('wings');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch wings
                const wingsRes = await fetch('/api/memory?action=list_wings');
                const wingsData = await wingsRes.json();
                setWings(wingsData.wings || []);

                // Fetch rooms for all wings in parallel
                const roomPromises = (wingsData.wings || []).map(async (wing: MemoryWing) => {
                    const res = await fetch(`/api/memory?action=get_rooms&wingId=${wing.id}`);
                    const data = await res.json();
                    return { wingId: wing.id, rooms: data.rooms || [] };
                });
                const roomResults = await Promise.all(roomPromises);
                const allRooms: MemoryRoom[] = [];
                for (const result of roomResults) {
                    allRooms.push(...result.rooms);
                }
                setRooms(allRooms);

                // Fetch drawers for all rooms in parallel (first 10 rooms to avoid too many requests)
                const roomIds = allRooms.slice(0, 10).map((r: MemoryRoom) => r.id);
                const drawerPromises = roomIds.map(async (roomId: string) => {
                    const res = await fetch(`/api/memory?action=get_drawers&roomId=${roomId}`);
                    const data = await res.json();
                    return { roomId, drawers: data.drawers || [] };
                });
                const drawerResults = await Promise.all(drawerPromises);
                const allDrawers: MemoryDrawer[] = [];
                for (const result of drawerResults) {
                    allDrawers.push(...result.drawers);
                }
                setDrawers(allDrawers);

                // Fetch knowledge graph triples
                try {
                    const graphRes = await fetch('/api/memory?action=query_graph');
                    const graphData = await graphRes.json();
                    setTriples(graphData.triples || []);
                } catch {
                    setTriples([]);
                }
            } catch (error) {
                console.error('Error fetching memory data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleWing = (wingId: string) => {
        setExpandedWings(prev => {
            const next = new Set(prev);
            if (next.has(wingId)) next.delete(wingId);
            else next.add(wingId);
            return next;
        });
    };

    const getWingRooms = (wingId: string) => rooms.filter(r => r.wing_id === wingId);
    const getRoomDrawers = (roomId: string) => drawers.filter(d => d.room_id === roomId);

    const filteredWings = wings.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    <h1 className="text-2xl font-serif font-medium">Memory Palace</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sistema de memoria y conocimiento de IA</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                    <Plus size={18} />
                    <span className="text-sm font-medium">Nuevo Wing</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Wings</p>
                    <p className="text-2xl font-serif">{wings.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rooms</p>
                    <p className="text-2xl font-serif">{rooms.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Drawers</p>
                    <p className="text-2xl font-serif">{drawers.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Triples</p>
                    <p className="text-2xl font-serif">{triples.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-4 mb-6">
                {(['wings', 'graph', 'search'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        {tab === 'wings' ? 'Wings & Rooms' : tab === 'graph' ? 'Knowledge Graph' : 'Buscar'}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar en memoria..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {activeTab === 'wings' && (
                <div className="space-y-4">
                    {filteredWings.map(wing => (
                        <div key={wing.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div 
                                onClick={() => toggleWing(wing.id)}
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Brain size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{wing.name}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            {wing.keywords.slice(0, 3).map(k => (
                                                <span key={k} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs text-muted-foreground">{getWingRooms(wing.id).length} rooms</span>
                                    {expandedWings.has(wing.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </div>

                            {expandedWings.has(wing.id) && (
                                <div className="border-t border-border/50 p-6 bg-muted/20">
                                    <div className="grid grid-cols-2 gap-4">
                                        {getWingRooms(wing.id).map(room => (
                                            <div 
                                                key={room.id}
                                                onClick={() => setSelectedRoom(room.id)}
                                                className={`p-4 bg-card border rounded-xl cursor-pointer hover:border-primary/50 transition-all ${selectedRoom === room.id ? 'border-primary' : 'border-border'}`}
                                            >
                                                <div className="flex items-center space-x-3 mb-2">
                                                    {HALL_ICONS[room.hall_type] || <FolderOpen size={16} />}
                                                    <h4 className="font-medium text-sm">{room.name}</h4>
                                                </div>
                                                {room.description && (
                                                    <p className="text-xs text-muted-foreground">{room.description}</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-2">
                                                    {getRoomDrawers(room.id).length} drawers
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'graph' && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-medium mb-4 flex items-center space-x-2">
                            <Network size={18} />
                            <span>Knowledge Graph</span>
                        </h3>
                        <div className="space-y-3">
                            {triples.map(triple => (
                                <div key={triple.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                                    <div className="flex items-center space-x-4">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-sm rounded-full font-medium">{triple.entity_subject}</span>
                                        <span className="text-muted-foreground">→ {triple.relationship} →</span>
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-sm rounded-full font-medium">{triple.entity_object}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{Math.round(triple.confidence_score * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'search' && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-medium mb-4">Resultados de búsqueda</h3>
                    {searchTerm ? (
                        <SearchResults searchTerm={searchTerm} />
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Ingresa un término de búsqueda</p>
                    )}
                </div>
            )}
        </div>
    );
}

function SearchResults({ searchTerm }: { searchTerm: string }) {
    const [results, setResults] = useState<MemoryDrawer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!searchTerm.trim()) return;
        const fetchSearch = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/memory?action=search&q=${encodeURIComponent(searchTerm)}`);
                const data = await res.json();
                setResults(data.results || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSearch();
    }, [searchTerm]);

    if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto" />;
    if (!results.length) return <p className="text-muted-foreground text-center py-4">Sin resultados</p>;

    return (
        <div className="space-y-4">
            {results.map(drawer => (
                <div key={drawer.id} className="p-4 border border-border rounded-xl">
                    <p className="text-sm">{drawer.content}</p>
                    <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">{drawer.content_type}</span>
                        <span className="text-xs text-muted-foreground">Importancia: {drawer.importance_score}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}