'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    leads?: any[];
    properties?: any[];
    investors?: any[];
    iaiSuggestions?: any[];
  };
}

export default function AIChat({ isOpen, onClose, context }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de IA en Alea Signature. Puedo ayudarte con:\n\n📋 **Gestión de Leads** - Ver estados, crear nuevas oportunidades\n🏠 **Propiedades** - Buscar activos, ver detalles\n👥 **Inversores** - Consultar perfiles, presupuestos\n📊 **Bandeja IAI** - Revisar emails analizados\n💼 **Tareas** - Crear recordatorios, seguir acciones\n\n¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/crm-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildContextSummary = () => {
    let summary = '';
    
    if (context?.leads?.length) {
      summary += `\n📋 LEADS ACTIVOS (${context.leads.length}): `;
      context.leads.slice(0, 5).forEach((lead: any) => {
        summary += `\n- ${lead.status}: ${lead.name || lead.email || 'Sin nombre'}`;
      });
    }

    if (context?.properties?.length) {
      summary += `\n\n🏠 PROPIEDADES (${context.properties.length}): `;
      context.properties.slice(0, 5).forEach((prop: any) => {
        summary += `\n- ${prop.title}: ${prop.price}€ (${prop.type})`;
      });
    }

    if (context?.investors?.length) {
      summary += `\n\n👥 INVERSORES (${context.investors.length}): `;
      context.investors.slice(0, 5).forEach((inv: any) => {
        summary += `\n- ${inv.full_name}: ${inv.budget_min}-${inv.budget_max}€`;
      });
    }

    if (context?.iaiSuggestions?.length) {
      const pending = context.iaiSuggestions.filter((s: any) => s.status === 'pending').length;
      summary += `\n\n📬 BANDEJA IAI: ${pending} pendientes`;
    }

    return summary || 'Sin contexto adicional';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Asistente IA</h3>
            <p className="text-xs text-muted-foreground">Alea Signature</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && <Bot className="w-4 h-4 mt-1 text-primary" />}
                {message.role === 'user' && <User className="w-4 h-4 mt-1" />}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl p-3 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-muted border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
