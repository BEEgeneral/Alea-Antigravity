'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, X, MessageSquare, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface HermesStreamEvent {
  type: 'content' | 'tool_calls' | 'tool_result' | 'done' | 'error';
  content?: string;
  tools?: any[];
  toolCallId?: string;
  toolName?: string;
  result?: string;
  error?: string;
}

interface VoiceConfig {
  enabled: boolean;
  voiceId?: string;
}

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
    >
      <MessageSquare size={28} />
    </button>
  );
}

export default function PelayoChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({ enabled: false });
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && showWelcome) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '👋 ¡Hola! Soy **Pelayo**, tu asistente de inteligencia patrimonial de Alea Signature.\n\n🎯 **Puedo ayudarte con:**\n• Consultas sobre el CRM (leads, inversores, propiedades)\n• Clasificación con Piedras Preciosas\n• Gestión de agenda y recordatorios\n• Cálculo de comisiones\n• Verificación de NDA\n• Y mucho más...\n\n✨ Ahora con **voz** - ¡Prueba a hablarme!\n\n¿En qué puedo ayudarte?',
        timestamp: new Date()
      }]);
      setShowWelcome(false);
    }
  }, [isOpen, showWelcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!voiceConfig.enabled) return;

    try {
      setIsSpeaking(true);

      const response = await fetch('https://api.minimax.io/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'speech-02',
          text: text.substring(0, 500),
          voice: voiceConfig.voiceId || 'male-qn-qingse',
          speed: 1.0,
          pitch: 0,
          volume: 0,
          format: 'mp3'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  }, [voiceConfig]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'speech-02-hd');

        try {
          const response = await fetch('https://api.minimax.io/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_KEY || ''}`
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              setInput(data.text);
              sendMessage(data.text);
            }
          }
        } catch (error) {
          console.error('Transcription error:', error);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

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
    setIsStreaming(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    }]);

    let fullContent = '';

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/hermes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history, stream: true }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: HermesStreamEvent = JSON.parse(line.substring(6));

                if (event.type === 'content' && event.content) {
                  fullContent += event.content;
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  ));
                }

                if (event.type === 'done') {
                  if (voiceConfig.enabled && fullContent) {
                    setTimeout(() => speakText(fullContent), 500);
                  }
                }

                if (event.type === 'error') {
                  console.error('Stream error:', event.error);
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }
      }

    } catch (error: any) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: `❌ Error de conexión: ${error.message}`, streaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    setVoiceConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[420px] h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 150px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-amber-500 to-orange-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Pelayo</h3>
            <p className="text-xs text-white/80">Hermes · MiniMax M2.7</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${voiceConfig.enabled ? 'bg-white/30' : 'hover:bg-white/20'}`}
            title={voiceConfig.enabled ? 'Desactivar voz' : 'Activar voz'}
          >
            {voiceConfig.enabled ? (
              <Volume2 className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/60" />
            )}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-2 ${
                msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-muted rounded-tl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">
                  {msg.content}
                  {msg.streaming && <span className="animate-pulse">▊</span>}
                </p>
                <p className={`text-[10px] mt-1 ${
                  msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                }`}>
                  {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <div className="flex items-center justify-center space-x-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Escuchando...</span>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="px-4 py-2 bg-green-500/10 border-t border-green-500/20">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Reproduciendo voz...</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje o habla..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            disabled={isLoading}
          />

          {voiceConfig.enabled && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`p-2.5 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title={isRecording ? 'Detener grabación' : 'Grabar voz'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Powered by MiniMax M2.7 · Hermes Core
        </p>
      </div>
    </div>
  );
}
