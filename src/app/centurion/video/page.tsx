"use client";

import { useState, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Settings, Users, Loader2, Phone, PhoneOff, Monitor } from "lucide-react";

interface Room {
    id: string;
    name: string;
    participants: string[];
    created_at: string;
    status: 'active' | 'ended';
}

export default function VideoPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);

    useEffect(() => {
        setRooms([
            { id: '1', name: 'Reunión con Carlos Ruiz', participants: ['beenocode@gmail.com', 'carlos@test.com'], created_at: new Date().toISOString(), status: 'ended' },
            { id: '2', name: 'Presentación Palacio Gran Via', participants: ['beenocode@gmail.com', 'maria@test.com'], created_at: new Date().toISOString(), status: 'ended' },
        ]);
        setLoading(false);
    }, []);

    const startCall = (roomId: string) => {
        setActiveRoom(roomId);
        setIsInCall(true);
    };

    const endCall = () => {
        setIsInCall(false);
        setActiveRoom(null);
    };

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
                    <h1 className="text-2xl font-serif font-medium">Video Llamadas</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestionar reuniones y videollamadas con Jitsi</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all">
                    <Video size={18} />
                    <span className="text-sm font-medium">Nueva Reunión</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Reuniones</p>
                    <p className="text-2xl font-serif">{rooms.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Activas</p>
                    <p className="text-2xl font-serif text-green-500">{rooms.filter(r => r.status === 'active').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Finalizadas</p>
                    <p className="text-2xl font-serif">{rooms.filter(r => r.status === 'ended').length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Esta Semana</p>
                    <p className="text-2xl font-serif">{rooms.filter(r => new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
                </div>
            </div>

            {/* In Call View */}
            {isInCall ? (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-muted to-background flex items-center justify-center relative">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={48} className="text-primary" />
                            </div>
                            <h3 className="font-serif text-xl mb-2">Sala: {activeRoom || 'Reunión'}</h3>
                            <p className="text-muted-foreground">Conectando...</p>
                        </div>
                        
                        {/* Call Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-card border border-border rounded-full px-6 py-4 shadow-xl">
                            <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <button 
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                            </button>
                            <button 
                                onClick={endCall}
                                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                            >
                                <PhoneOff size={20} />
                            </button>
                            <button className="p-4 bg-muted rounded-full hover:bg-muted/80 transition-all">
                                <Monitor size={20} />
                            </button>
                            <button className="p-4 bg-muted rounded-full hover:bg-muted/80 transition-all">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Quick Start */}
                    <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                        <h3 className="font-medium mb-4">Iniciar Videollamada Rápida</h3>
                        <div className="flex items-center space-x-4">
                            <input 
                                type="text" 
                                placeholder="Nombre de la sala"
                                className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:border-primary/50"
                            />
                            <button 
                                onClick={() => startCall('quick-room')}
                                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium"
                            >
                                <Phone size={18} />
                                <span>Comenzar</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Rooms */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <h3 className="font-medium">Reuniones Recientes</h3>
                        </div>
                        <div className="divide-y divide-border/50">
                            {rooms.map(room => (
                                <div key={room.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-all">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <Video size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{room.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {room.participants.length} participantes • {new Date(room.created_at).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            room.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {room.status}
                                        </span>
                                        <button 
                                            onClick={() => startCall(room.name)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all text-sm"
                                        >
                                            <Video size={16} />
                                            <span>Reunir</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {rooms.length === 0 && (
                            <div className="text-center py-12">
                                <Video size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">No hay reuniones recientes</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}