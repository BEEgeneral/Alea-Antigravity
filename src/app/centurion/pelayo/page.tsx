"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Search, RefreshCw, Loader2, Trash2, Send, User, Bot, ExternalLink, Mic, MicOff, Volume2, VolumeX, Settings } from "lucide-react";

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

export default function PelayoPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputMessage, setInputMessage] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice state - Web Speech API
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(0);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

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
                    loadData(token, data.profile?.id || data.profile?.email);
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const loadData = async (token: string, userId: string) => {
        try {
            const convRes = await fetch(`/api/pelayo-chat?type=conversations&userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const notifRes = await fetch(`/api/pelayo-chat?type=notifications&userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (convRes.ok) {
                const convData = await convRes.json();
                setMessages(convData.messages || []);
            }

            if (notifRes.ok) {
                const notifData = await notifRes.json();
                setNotifications(notifData.notifications || []);
            }
        } catch (error) {
            console.error('Load data error:', error);
        }
    };

    // STT: Start recording using Web Speech API
    const startRecording = () => {
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert('Tu navegador no soporta reconocimiento de voz.');
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'es-ES';

            recognition.onstart = () => {
                setIsRecording(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(prev => prev + transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('No se pudo acceder al micrófono. Verifica los permisos.');
        }
    };

    // STT: Stop recording
    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    // TTS: Play text as speech using Web Speech API
    const playTTS = (text: string) => {
        if (isPlaying) {
            stopTTS();
            return;
        }

        try {
            const synth = window.speechSynthesis;
            if (!synth) {
                alert('Tu navegador no soporta síntesis de voz.');
                return;
            }

            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0;

            const voices = synth.getVoices();
            if (voices.length > 0) {
                const spanishVoices = voices.filter(v => v.lang.includes('es'));
                if (spanishVoices.length > 0) {
                    utterance.voice = spanishVoices[selectedVoice % spanishVoices.length];
                }
            }

            utterance.onend = () => {
                setIsPlaying(false);
            };

            utterance.onerror = () => {
                setIsPlaying(false);
            };

            synthRef.current = utterance;
            synth.speak(utterance);
            setIsPlaying(true);
        } catch (error) {
            console.error('TTS error:', error);
        }
    };

    // TTS: Stop playing
    const stopTTS = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    };

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || sending) return;

        const token = localStorage.getItem('insforge_token');
        if (!token) return;

        setSending(true);
        const userMessage = inputMessage;
        setInputMessage("");

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            conversation_id: 'current',
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString()
        }]);

        try {
            const res = await fetch('/api/pelayo-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    user: { id: currentUser?.id || currentUser?.email }
                })
            });

            if (res.ok) {
                const data = await res.json();

                if (data.response) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        conversation_id: 'current',
                        role: 'assistant',
                        content: data.response,
                        created_at: new Date().toISOString()
                    }]);
                }

                if (data.pendingAction) {
                    loadData(token, currentUser?.id || currentUser?.email);
                }
            } else {
                const error = await res.json();
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    conversation_id: 'current',
                    role: 'assistant',
                    content: `Error: ${error.error || 'No pude procesar tu mensaje'}`,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (error: any) {
            console.error('Send message error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                conversation_id: 'current',
                role: 'assistant',
                content: 'Error de conexión. Intenta de nuevo.',
                created_at: new Date().toISOString()
            }]);
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = () => {
        const token = localStorage.getItem('insforge_token');
        if (token) {
            loadData(token, currentUser?.id || currentUser?.email);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8 h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Pelayo AI Assistant</h1>
                    <p className="text-sm text-muted-foreground mt-1">Asistente de inteligencia artificial para Alea Signature</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-all"
                >
                    <RefreshCw size={18} />
                    <span className="text-sm">Actualizar</span>
                </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Bot className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Bienvenido a Pelayo</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Soy tu asistente de inteligencia artificial. Puedo ayudarte a gestionar inversores,
                                propiedades, y analizar oportunidades de inversión. ¿En qué puedo ayudarte?
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}}`}
                            >
                                <div className={`flex items-start space-x-3 max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        msg.role === 'user' ? 'bg-primary text-white' : 'bg-amber-500/20 text-amber-500'
                                    }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-muted rounded-tl-none'
                                    }`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            {msg.role === 'assistant' && voiceEnabled && (
                                                <button
                                                    onClick={() => playTTS(msg.content)}
                                                    disabled={isPlaying}
                                                    className="shrink-0 p-1.5 rounded-lg hover:bg-black/10 transition-all"
                                                    title="Escuchar respuesta"
                                                >
                                                    {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        <p className={`text-[10px] mt-1 ${
                                            msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                                        }`}>
                                            {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center space-x-4">
                        {/* Mic button for STT */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-3 rounded-xl transition-all ${
                                isRecording
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}
                            title={isRecording ? 'Detener grabación' : 'Grabar voz'}
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Escribe tu mensaje o usa el micrófono..."
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                            disabled={sending || isRecording}
                        />

                        {/* Voice output toggle */}
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`p-3 rounded-xl transition-all ${
                                voiceEnabled
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}
                            title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                        >
                            <Volume2 className="w-5 h-5" />
                        </button>

                        {/* Voice settings */}
                        <button
                            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                            className={`p-3 rounded-xl transition-all ${
                                showVoiceSettings
                                    ? 'bg-primary text-white'
                                    : 'bg-muted hover:bg-muted/80'
                            }`}
                            title="Configuración de voz"
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        {/* Send button */}
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || sending || isRecording}
                            className="p-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Voice settings panel */}
                    {showVoiceSettings && (
                        <div className="mt-4 p-4 bg-muted rounded-xl">
                            <p className="text-sm font-medium mb-3">Configuración de Voz (Navegador)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">Voz</label>
                                    <select
                                        value={selectedVoice}
                                        onChange={(e) => setSelectedVoice(Number(e.target.value))}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                    >
                                        {availableVoices
                                            .filter(v => v.lang.includes('es'))
                                            .map((voice, index) => (
                                                <option key={voice.name} value={index}>
                                                    {voice.name} ({voice.lang})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => playTTS('Hola, soy Pelayo. ¿En qué puedo ayudarte hoy?')}
                                        disabled={isPlaying}
                                        className="flex items-center space-x-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                        <span className="text-sm">Probar voz</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications Sidebar */}
            {notifications.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Notificaciones Recientes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {notifications.slice(0, 3).map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-xl border ${
                                    notif.type === 'opportunity' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                    notif.type === 'alert' ? 'bg-red-500/5 border-red-500/20' :
                                    'bg-blue-500/5 border-blue-500/20'
                                }`}
                            >
                                <p className="text-sm font-medium">{notif.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    {new Date(notif.created_at).toLocaleDateString('es-ES')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
