/**
 * PelayoChat Component
 * AI Assistant for Alea Signature CRM
 * 
 * Features:
 * - Natural language queries to CRM
 * - Investor classification (Piedras Preciosas)
 * - Agenda integration
 * - Quick actions
 * - Conversation history
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Paperclip, Calendar, Users, Building, FileText, Sparkles, ChevronRight, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  stats?: {
    leads: number;
    properties: number;
    investors: number;
    agendaPending: number;
  };
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    leads?: any[];
    properties?: any[];
    investors?: any[];
    mandatarios?: any[];
    iaiSuggestions?: any[];
  };
  userInfo?: {
    id: string;
    email: string;
    role: string;
  };
}

const QUICK_ACTIONS = [
  { icon: Users, label: 'Ver Leads', query: 'Muestra los últimos leads' },
  { icon: Building, label: 'Ver Propiedades', query: 'Lista las propiedades disponibles' },
  { icon: FileText, label: 'Inversores', query: '-Dame un resumen de inversores' },
  { icon: Calendar, label: 'Agenda', query: 'Qué acciones tengo pendientes?' },
  { icon: Sparkles, label: 'Clasificar', query: 'Clasifica al último inversor según Piedras Preciosas' },
];

export default function PelayoChat({ isOpen, onClose, context, userInfo }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{leads: number; properties: number; investors: number; agendaPending: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load stats on mount
  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('insforge_token');
      const res = await fetch('/api/pelayo-chat?type=stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('insforge_token');
      
      const res = await fetch('/api/pelayo-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          context: {
            leads: context?.leads || [],
            properties: context?.properties || [],
            investors: context?.investors || [],
            mandatarios: context?.mandatarios || []
          },
          user: userInfo
        })
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'He procesado tu mensaje. ¿Hay algo más?',
        timestamp: new Date(),
        stats: data.stats
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.stats) {
        setStats(data.stats);
      }

    } catch (error: any) {
      console.error('Pelayo error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error de conexión: ${error.message}\n\nPor favor, intenta de nuevo.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[420px] h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 150px)' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Pelayo</h3>
            <p className="text-xs text-muted-foreground">Asistente Patrimonial</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="flex items-center justify-around px-4 py-2 border-b border-border bg-muted/30 text-xs">
          <div className="text-center">
            <p className="font-bold text-primary">{stats.leads}</p>
            <p className="text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-emerald-500">{stats.properties}</p>
            <p className="text-muted-foreground">Propiedades</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-blue-500">{stats.investors}</p>
            <p className="text-muted-foreground">Inversores</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-amber-500">{stats.agendaPending}</p>
            <p className="text-muted-foreground">Agenda</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="font-semibold mb-2">¡Bienvenido a Pelayo!</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
              Tu asistente de inteligencia patrimonial. Puedo ayudarte con el CRM, clasificar inversores y gestionar la agenda.
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(action.query)}
                  className="flex items-center space-x-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-xl text-xs transition-colors text-left"
                >
                  <action.icon className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-muted rounded-tl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                }`}>
                  {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregúntame cualquier cosa..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
            disabled={isLoading}
          />
          <button 
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Pelayo usa IA para entender y responder. Puede cometer errores.
        </p>
      </div>
    </div>
  );
}