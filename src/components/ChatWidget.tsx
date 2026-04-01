"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetProps = {
  /** Color primario del botón flotante y burbujas del asistente */
  accentColor?: string;
  /** Texto del placeholder del input */
  placeholder?: string;
  /** Mensaje inicial del asistente al abrir el chat */
  welcomeMessage?: string;
  /** Endpoint de la API (por defecto /api/chat) */
  apiEndpoint?: string;
};

// ─── Icono del bot (inline SVG, sin dependencias) ─────────────────────────────
const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
    <line x1="12" y1="16" x2="12" y2="16" strokeWidth="3" />
    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Burbuja de escritura (3 puntos animados) ─────────────────────────────────
const TypingDots = () => (
  <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#9ca3af",
          animation: "chatDot 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ChatWidget({
  accentColor = "#111111",
  placeholder = "Escribe tu pregunta...",
  welcomeMessage = "¡Hola! Soy el asistente de Sneakers Pro. ¿Buscas zapatillas para algún deporte en concreto o tienes dudas sobre algún modelo?",
  apiEndpoint = "/api/chat",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Foco en input al abrir
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Placeholder para la respuesta del asistente
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Error en la respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });

        // Actualizar el último mensaje en tiempo real
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
      }

      // Si el chat está cerrado, incrementar badge de no leídos
      if (!open) setUnread((n) => n + 1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Lo siento, ha habido un error. Inténtalo de nuevo.",
          };
          return updated;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, apiEndpoint, open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Estilos de animación ─────────────────────────────────────────── */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPop {
          0%   { transform: scale(0.8); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .chat-widget-panel {
          animation: chatSlideUp 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .chat-widget-btn {
          animation: chatPop 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .chat-msg-bubble {
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .chat-input-area::-webkit-scrollbar { display: none; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      {/* ── Panel del chat ───────────────────────────────────────────────── */}
      {open && (
        <div
          className="chat-widget-panel"
          style={{
            position: "fixed",
            bottom: "88px",
            right: "24px",
            width: "360px",
            maxHeight: "520px",
            background: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9998,
            fontFamily: "inherit",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: accentColor,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <BotIcon />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  Asistente Sneakers Pro
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                  {loading ? "Escribiendo..." : "En línea"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Mensajes */}
          <div
            className="chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  className="chat-msg-bubble"
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user" ? accentColor : "#f3f4f6",
                    color: msg.role === "user" ? "#fff" : "#111",
                    fontSize: 14,
                  }}
                >
                  {msg.content === "" && msg.role === "assistant" ? (
                    <TypingDots />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              className="chat-input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              style={{
                flex: 1,
                border: "1.5px solid #e5e7eb",
                borderRadius: "12px",
                padding: "10px 12px",
                fontSize: 14,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.4,
                maxHeight: 100,
                overflowY: "auto",
                transition: "border-color 0.15s",
                background: "#fafafa",
              }}
              onFocus={(e) => (e.target.style.borderColor = accentColor)}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: !input.trim() || loading ? "#e5e7eb" : accentColor,
                border: "none",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── Botón flotante ───────────────────────────────────────────────── */}
      <button
        className="chat-widget-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir chat"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: accentColor,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          zIndex: 9999,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
        }}
      >
        {open ? <CloseIcon /> : <BotIcon />}

        {/* Badge de mensajes no leídos */}
        {!open && unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: 20,
              height: 20,
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}
          >
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
