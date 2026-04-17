"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Search, RefreshCw, Loader2, Trash2, Eye, Download, Bell, AlertTriangle, CheckCircle } from "lucide-react";

interface ChatMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

interface Notification {
    id: string;
    type: 'opportunity' | 'system' | 'alert';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

interface Conversation {
    id: string;
    user_id: string;
    last_message: string;
    message_count: number;
    created_at: string;
    updated_at: string;
}

export default function PelayoPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'conversations' | 'notifications' | 'analytics'>('conversations');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

    useEffect(() => {
        setConversations([
            { id: '1', user_id: 'beenocode@gmail.com', last_message: 'Quiero ver propiedades en Madrid', message_count: 23, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '2', user_id: 'admin@aleasignature.com', last_message: 'Muestra los inversores de Madrid', message_count: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
        
        setMessages([
            { id: '1', conversation_id: '1', role: 'user', content: 'Quiero ver propiedades en Madrid', created_at: new Date().toISOString() },
            { id: '2', conversation_id: '1', role: 'assistant', content: 'He encontrado 15 propiedades en Madrid. Aquí están las más relevantes para inversión:', created_at: new Date().toISOString() },
            { id: '3', conversation_id: '1', role: 'user', content: '¿Cuál tiene mejor rentabilidad?', created_at: new Date().toISOString() },
            { id: '4', conversation_id: '1', role: 'assistant', content: 'Basándome en el análisis, el edificio en Chueca tiene una rentabilidad estimada del 8.5% anual.', created_at: new Date().toISOString() },
        ]);

        setNotifications([
            { id: '1', type: 'opportunity', title: 'Oportunidad detectada', message: 'Nuevo lead de inversor interesado en hotels', read: false, created_at: new Date().toISOString() },
            { id: '2', type: 'alert', title: 'Alerta de precio', message: ' propiedad reducida un 10%', read: false, created_at: new Date().toISOString() },
            { id: '3', type: 'system', title: 'Informe generado', message: 'Reporte semanal de actividad listo', read: true, created_at: new Date().toISOString() },
        ]);

        setLoading(false);
    }, []);

    const filteredConversations = conversations.filter(c => 
        c.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNotifications = notifications.filter(n => 
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleDeleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
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
                    <h1 className="text-2xl font-serif font-medium">Pelayo Chat Logs</h1>
                    <p className="text-sm text-muted-foreground mt-1">Historial de conversaciones y notificaciones</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all">
                    <RefreshCw size={18} />
                    <span className="text-sm">Actualizar</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conversaciones</p>
                    <p className="text-2xl font-serif">{conversations.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mensajes</p>
                    <p className="text-2xl font-serif">{messages.length}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notificaciones</p>
                    <p className="text-2xl font-serif text-amber-500">{notifications.filter(n => !n.read).length} sin leer</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hoy</p>
                    <p className="text-2xl font-serif">{conversations.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-4 mb-6">
                <button 
                    onClick={() => setActiveTab('conversations')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'conversations' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                >
                    Conversaciones
                </button>
                <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                >
                    Notificaciones ({notifications.filter(n => !n.read).length})
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                >
                    Analytics
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 max-w-md flex items-center space-x-2 bg-card border border-border rounded-xl px-4 py-2">
                    <Search size={18} className="text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'conversations' ? "Buscar conversaciones..." : "Buscar notificaciones..."}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {activeTab === 'conversations' && (
                <div className="grid grid-cols-3 gap-6">
                    {/* Conversation List */}
                    <div className="col-span-1 space-y-3">
                        {filteredConversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`p-4 bg-card border rounded-xl cursor-pointer hover:border-primary/50 transition-all ${selectedConversation === conv.id ? 'border-primary' : 'border-border'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium truncate">{conv.user_id}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(conv.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                                <p className="text-[10px] text-muted-foreground mt-2">{conv.message_count} mensajes</p>
                            </div>
                        ))}
                    </div>

                    {/* Message Thread */}
                    <div className="col-span-2 bg-card border border-border rounded-2xl p-6">
                        {selectedConversation ? (
                            <div className="space-y-4">
                                {messages.filter(m => m.conversation_id === selectedConversation).map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-muted'}`}>
                                            <div className="flex items-center space-x-2 mb-1">
                                                {msg.role === 'assistant' ? <MessageSquare size={14} /> : <span className="text-xs opacity-60">{msg.role}</span>}
                                            </div>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className="text-[10px] opacity-60 mt-2">{new Date(msg.created_at).toLocaleTimeString('es-ES')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">Selecciona una conversación</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    {filteredNotifications.map(notif => (
                        <div key={notif.id} className={`p-6 bg-card border rounded-2xl ${notif.read ? 'border-border' : 'border-amber-500/50'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'opportunity' ? 'bg-green-500/10' : notif.type === 'alert' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                        {notif.type === 'opportunity' ? <CheckCircle size={20} className="text-green-500" /> :
                                         notif.type === 'alert' ? <AlertTriangle size={20} className="text-red-500" /> :
                                         <Bell size={20} className="text-blue-500" />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">{notif.title}</h3>
                                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground mt-2">{new Date(notif.created_at).toLocaleString('es-ES')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!notif.read && (
                                        <button 
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            className="px-3 py-1 bg-muted rounded-lg text-xs hover:bg-muted/80 transition-all"
                                        >
                                            Marcar leída
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDeleteNotification(notif.id)}
                                        className="p-2 hover:bg-muted rounded-lg transition-colors text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredNotifications.length === 0 && (
                        <div className="text-center py-12">
                            <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No se encontraron notificaciones</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-card border border-border rounded-2xl">
                        <h3 className="font-medium mb-4">Mensajes por día</h3>
                        <div className="h-40 flex items-end space-x-2">
                            {[12, 19, 15, 22, 28, 24, 18].map((val, i) => (
                                <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${val * 3}%` }}>
                                    <p className="text-[10px] text-center mt-2">{val}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
                        </div>
                    </div>
                    <div className="p-6 bg-card border border-border rounded-2xl">
                        <h3 className="font-medium mb-4">Intents más comunes</h3>
                        <div className="space-y-3">
                            {['Crear lead', 'Buscar propiedad', 'Ver inversores', 'Consultar precio', 'Generar reporte'].map((intent, i) => (
                                <div key={intent} className="flex items-center justify-between">
                                    <span className="text-sm">{intent}</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${100 - i * 15}%` }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{100 - i * 15}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}