'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Plus, Building, Users, ShieldCheck, FileText, Brain, Sparkles, ChevronRight, Trash2, Mic, MicOff, Bell, BellOff, Check, XCircle, Paperclip, File, Upload, Image, Calendar } from 'lucide-react';
import { extractPDFContent } from '@/lib/pdf-utils';
import { marked } from 'marked';

marked.setOptions({ breaks: true });

function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: { type: string; data: any }[];
  analysis?: {
    type: 'property' | 'investor' | 'mandatario' | 'lead' | 'none';
    extracted: any;
    confidence: number;
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
    agendaStats?: {
      overdue?: number;
      pending?: number;
    };
  };
  userInfo?: {
    id: string;
    email: string;
    role: string;
  };
}

export default function PelayoChat({ isOpen, onClose, context, userInfo }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pendingPreview, setPendingPreview] = useState<any>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; type: string; extractedContent?: { text: string; images: { page: number; data: string }[] } } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `¡Bienvenido a Alea Signature! 👋\n\nSoy **Pelayo**, tu asistente de inteligencia patrimonial. Estoy aquí para ayudarte a gestionar tus activos, inversores y oportunidades.\n\nPuedo mostrarte el estado actual de tu cartera, analizar conversaciones para detectar nuevas oportunidades, y ayudarte a mantener actualizado el CRM.\n\n¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
        suggestedActions: [
          { type: 'show_summary', data: {} },
          { type: 'show_properties', data: {} },
          { type: 'show_investors', data: {} }
        ]
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const isDoc = file.type.includes('document') || file.type.includes('word');

    if (!isPDF && !isImage && !isDoc) {
      alert('Formato no soportado. Sube PDF, imagen o documento de Word.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileInfo: { name: string; data: string; type: string; extractedContent?: { text: string; images: { page: number; data: string }[] } } = {
        name: file.name,
        data: fileData,
        type: file.type
      };

      if (isPDF) {
        try {
          const pdfContent = await extractPDFContent(fileData);
          fileInfo.extractedContent = {
            text: pdfContent.text,
            images: pdfContent.images.map(img => ({ page: img.page, data: img.data }))
          };
        } catch (pdfError) {
          console.error('Error extracting PDF content:', pdfError);
        }
      }

      setAttachedFile(fileInfo);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error al leer el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (attachedFile ? `[Archivo adjunto: ${attachedFile.name}]` : ''),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const token = localStorage.getItem('insforge_token') || '';

      const response = await fetch('/api/pelayo-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage.content,
          file: attachedFile,
          extractedContent: attachedFile?.extractedContent,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          context: {
            leads: context?.leads || [],
            properties: context?.properties || [],
            investors: context?.investors || [],
            mandatarios: context?.mandatarios || []
          },
          user: userInfo
        })
      });

      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.response) {
        let responseContent = data.response;
        
        // If a record was created, add confirmation
        if (data.createdRecord) {
          const entityLabels: Record<string, string> = {
            property: 'Propiedad',
            investor: 'Inversor',
            lead: 'Lead',
            mandatario: 'Mandatario'
          };
          const label = entityLabels[data.createdRecord.table] || data.createdRecord.table;
          responseContent += `\n\n✅ **${label} creado correctamente en el CRM.**`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          suggestedActions: data.suggestedActions || [],
          analysis: data.analysis
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.error) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'He recibido tu mensaje pero no tengo una respuesta en este momento. ¿Podrías reformular tu pregunta?',
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      console.error('Pelayo error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.name === 'AbortError' 
          ? 'Tiempo de espera agotado. Por favor, intenta de nuevo.'
          : 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      }]);
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

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    
    recognition.onstart = () => {
      setIsRecording(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      if (input.trim()) {
        sendMessage();
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };
    
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const fetchNotifications = async () => {
    if (!userInfo?.id) return;
    try {
      const res = await fetch(`/api/pelayo-chat?type=notifications&userId=${userInfo.id}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const fetchPendingActions = async () => {
    if (!userInfo?.id) return;
    try {
      const res = await fetch(`/api/pelayo-chat?type=pending&userId=${userInfo.id}`);
      const data = await res.json();
      setPendingActions(data.pendingActions || []);
    } catch (e) {
      console.error('Error fetching pending actions:', e);
    }
  };

  const confirmPendingAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/pelayo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userInfo,
          action: 'confirm',
          pendingActionId: actionId
        })
      });
      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }
    } catch (e) {
      console.error('Error confirming action:', e);
    }
  };

  const cancelPendingAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/pelayo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userInfo,
          action: 'cancel',
          pendingActionId: actionId
        })
      });
      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }
    } catch (e) {
      console.error('Error cancelling action:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPendingActions();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchPendingActions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userInfo?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex overflow-hidden border border-border">
        
        {/* Sidebar con análisis */}
        <div className={`${showAnalysis ? 'w-80' : 'w-0'} transition-all overflow-hidden border-r border-border bg-muted/30`}>
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Brain size={18} />
                Análisis IA
              </h3>
              <button onClick={() => setShowAnalysis(false)} className="p-1 hover:bg-muted rounded">
                <X size={16} />
              </button>
            </div>

            {/* Resumen del contexto */}
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Resumen CRM</h4>
              <div className="space-y-3">
                <div className="bg-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Building size={14} className="text-emerald-500" />
                    <span className="text-xs font-medium">Propiedades</span>
                  </div>
                  <p className="text-2xl font-bold">{context?.properties?.length || 0}</p>
                </div>
                <div className="bg-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-blue-500" />
                    <span className="text-xs font-medium">Inversores</span>
                  </div>
                  <p className="text-2xl font-bold">{context?.investors?.length || 0}</p>
                </div>
                <div className="bg-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-amber-500" />
                    <span className="text-xs font-medium">Leads</span>
                  </div>
                  <p className="text-2xl font-bold">{context?.leads?.length || 0}</p>
                </div>
                <div className="bg-card p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-purple-500" />
                    <span className="text-xs font-medium">Mandatarios</span>
                  </div>
                  <p className="text-2xl font-bold">{context?.mandatarios?.length || 0}</p>
                </div>
                {context?.agendaStats && (
                  <>
                    <div className="bg-card p-3 rounded-xl border-l-4 border-red-500">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell size={14} className="text-red-500" />
                        <span className="text-xs font-medium">Acciones Vencidas</span>
                      </div>
                      <p className="text-2xl font-bold text-red-500">{context.agendaStats.overdue || 0}</p>
                    </div>
                    <div className="bg-card p-3 rounded-xl border-l-4 border-amber-500">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={14} className="text-amber-500" />
                        <span className="text-xs font-medium">Acciones Pendientes</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-500">{context.agendaStats.pending || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Pelayo</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  Asistente de Patrimonio
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`p-2 rounded-lg transition-all ${showAnalysis ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
              >
                <Brain size={18} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && <Bot className="w-4 h-4 mt-1 text-emerald-500 flex-shrink-0" />}
                    {message.role === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                    <div 
                      className="text-sm whitespace-pre-wrap flex-1 [&_strong]:font-bold [&_em]:italic"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} 
                    />
                  </div>
                  
                  {/* Suggested actions */}
                  {message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-2">
                      {message.suggestedActions.map((action: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setInput(action.label || action.type)}
                          className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-1 transition-all"
                        >
                          {action.type === 'show_summary' && <FileText size={12} />}
                          {action.type === 'show_properties' && <Building size={12} />}
                          {action.type === 'show_investors' && <Users size={12} />}
                          {action.label || action.type}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Analysis badge */}
                  {message.analysis && message.analysis.type && message.analysis.type !== 'none' && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        message.analysis.type === 'property' ? 'bg-emerald-500/20 text-emerald-400' :
                        message.analysis.type === 'investor' ? 'bg-blue-500/20 text-blue-400' :
                        message.analysis.type === 'mandatario' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {message.analysis.type?.toUpperCase() || 'ENTITY'} detectado ({Math.round((message.analysis.confidence || 0) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl p-4 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Pelayo está analizando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            {/* Pending Actions Preview */}
            {pendingActions.length > 0 && (
              <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">Acciones pendientes</span>
                </div>
                {pendingActions.map((action: any) => (
                  <div key={action.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs">{action.action_type.replace('create_', '')}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmPendingAction(action.id)}
                        className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs flex items-center gap-1"
                      >
                        <Check size={12} /> Crear
                      </button>
                      <button
                        onClick={() => cancelPendingAction(action.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs flex items-center gap-1"
                      >
                        <XCircle size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attached File Preview */}
            {attachedFile && (
              <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <File size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{attachedFile.name}</p>
                    {attachedFile.extractedContent ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <FileText size={10} />
                          {attachedFile.extractedContent.text.substring(0, 50)}...
                        </span>
                        {attachedFile.extractedContent.images.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image size={10} />
                            {attachedFile.extractedContent.images.length} imágenes
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Upload size={10} />
                        Listo para enviar a Pelayo
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={removeAttachedFile}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                className={`px-3 rounded-xl flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-muted hover:bg-muted/70'
                }`}
                title="Entrada por voz"
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium ${
                  attachedFile 
                    ? 'bg-emerald-500/20 text-emerald-500' 
                    : 'bg-muted hover:bg-muted/70'
                }`}
                title="Subir PDF"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                <span>PDF</span>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta a Pelayo..."
                className="flex-1 bg-muted border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-3 rounded-xl ${
                  notificationsEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'
                }`}
                title="Notificaciones"
              >
                {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              </button>
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
            
            {/* Notifications */}
            {notificationsEnabled && notifications.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {notifications.map((notif: any) => (
                  <div 
                    key={notif.id}
                    className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 whitespace-nowrap ${
                      notif.type === 'opportunity' 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-blue-500/20 text-blue-500'
                    }`}
                  >
                    <Bell size={12} />
                    {notif.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
