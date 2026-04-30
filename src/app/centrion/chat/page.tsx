"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Trash2, Copy, CheckCheck, AlertCircle, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: Date;
  error?: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: string;
  success: boolean;
}

interface StreamChunk {
  type: "content" | "tool_calls" | "tool_result" | "done" | "error";
  content?: string;
  tools?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
  result?: string;
  error?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hermes_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })));
      } catch {
        // ignore corrupt data
      }
    } else {
      // Welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "🏛 **Bienvenido a Hermes — Centro de Inteligencia Alea**\n\nSoy **Pelayo**, tu asistente patrimonial. Puedo ayudarte con:\n\n• 📊 **Inversores** — Clasificación, perfiles, estrategias\n• 🏠 **Propiedades** — Blind listings, oportunidades, matches\n• 📋 **Mandatos** — Estado, vencimientos, alertas\n• 📧 **Inbox** — Clasificación de emails, detección de leads\n• 🧠 **Memoria** — Guardar y recuperar contexto de conversaciones\n\n¿En qué puedo ayudarte hoy?",
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Save history
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("hermes_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    setMessages(prev => [...prev, {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }]);
  }, []);

  const updateLastMessage = useCallback((update: Partial<Message>) => {
    setMessages(prev => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.id !== "welcome") {
        next[next.length - 1] = { ...last, ...update };
      }
      return next;
    });
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage({ role: "user", content: text });

    // Create placeholder for assistant
    const placeholderId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: placeholderId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    // Prepare abort controller
    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem("insforge_token");
      if (!token) {
        throw new Error("No hay sesión activa. Ve a /login.");
      }

      const response = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-20).map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se pudo leer la respuesta");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const chunk: StreamChunk = JSON.parse(raw);

            if (chunk.type === "content" && chunk.content) {
              updateLastMessage({
                content: (messages.find(m => m.id === placeholderId)?.content || "") + chunk.content,
              });
            } else if (chunk.type === "tool_calls" && chunk.tools) {
              updateLastMessage({ toolCalls: chunk.tools });
            } else if (chunk.type === "tool_result" && chunk.toolCallId && chunk.toolName) {
              const current = messages.find(m => m.id === placeholderId);
              const results = [...(current?.toolResults || [])];
              const idx = results.findIndex(r => r.toolCallId === chunk.toolCallId);
              const entry: ToolResult = {
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                result: chunk.result || "",
                success: true,
              };
              if (idx >= 0) results[idx] = entry; else results.push(entry);
              updateLastMessage({ toolResults: results });
            } else if (chunk.type === "error") {
              setError(chunk.error || "Error desconocido");
            }
          } catch {
            // ignore parse errors on individual chunks
          }
        }
      }

      // Finalize: remove thinking tags from content
      const final = messages.find(m => m.id === placeholderId);
      if (final) {
        const cleaned = final.content
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/\*\*Think\*\*:.*$/gm, "")
          .trim();
        if (cleaned !== final.content) {
          updateLastMessage({ content: cleaned });
        }
      }

    } catch (err: any) {
      if (err.name === "AbortError") {
        updateLastMessage({ content: (messages.find(m => m.id === placeholderId)?.content || "") + "\n\n_[Cancelled]_", error: false });
      } else {
        updateLastMessage({ content: `❌ Error: ${err.message}`, error: true });
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("hermes_chat_history");
    setError(null);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const adjustTextarea = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-amber-500" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-medium">Hermes Chat</h1>
            <p className="text-xs text-muted-foreground">Pelayo — Asistente Patrimonial</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <button
              onClick={stopGeneration}
              className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
            >
              <X size={12} /> Stop
            </button>
          )}
          <button
            onClick={clearChat}
            className="px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={12} /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onCopy={copyMessage}
            isLoading={isLoading}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border/50">
        <div className="flex items-end gap-3 bg-card border border-border/50 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); adjustTextarea(); }}
            onKeyDown={handleKeyDown}
            placeholder="Pregúntame cualquier cosa sobre inversores, propiedades, mandatos..."
            className="flex-1 bg-transparent resize-none text-sm outline-none placeholder:text-muted-foreground/50 max-h-[200px]"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-muted disabled:text-muted-foreground rounded-xl transition-colors flex-shrink-0"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
          Hermes retains memory of this conversation. Press Enter to send, Shift+Enter for newline.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, onCopy, isLoading }: { message: Message; onCopy: (c: string) => void; isLoading: boolean }) {
  const [showTools, setShowTools] = useState(false);
  const isUser = message.role === "user";
  const isError = message.error;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-blue-500/20" : "bg-amber-500/20"
        }`}>
          {isUser
            ? <User size={14} className="text-blue-400" />
            : <Bot size={14} className="text-amber-500" />
          }
        </div>

        <div className="space-y-2">
          {/* Content */}
          <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isUser
              ? "bg-blue-500/20 text-blue-100 rounded-tr-md"
              : isError
              ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-md"
              : "bg-card border border-border/50 text-foreground rounded-tl-md"
          }`}>
            {message.content}
            {isLoading && message.content === "" && (
              <span className="inline-flex gap-1 ml-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>

          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div>
              <button
                onClick={() => setShowTools(!showTools)}
                className="text-[10px] text-amber-500/80 hover:text-amber-500 transition-colors flex items-center gap-1"
              >
                <span className="font-mono">⚡ {message.toolCalls.length} tool call(s)</span>
              </button>
              {showTools && message.toolResults && message.toolResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.toolResults.map((tr, i) => (
                    <div key={i} className="bg-card/80 border border-border/30 rounded-lg px-3 py-2 text-[10px] font-mono">
                      <div className="text-amber-500/80 mb-1">→ {tr.toolName}</div>
                      <div className="text-muted-foreground/70 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                        {tr.result}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!isUser && message.content && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/40">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                onClick={() => onCopy(message.content)}
                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Copy size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
