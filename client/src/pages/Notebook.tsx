/**
 * Notebook.tsx — NotebookLM-style AI chat page
 * Allows users to have intelligent conversations about news articles
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Newspaper,
  Trash2,
  Plus,
  ExternalLink,
  Loader2,
  BookOpen,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ id: number; title: string; source: string; publishedAt: Date }>;
  createdAt?: Date;
}

interface Session {
  id: number;
  sessionKey: string;
  title: string;
  createdAt: Date;
}

const SESSION_KEY_STORAGE = "arabismart_notebook_session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MarkdownText({ text }: { text: string }) {
  // Simple markdown rendering: bold, italic, lists
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-bold">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        // Inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Notebook() {
  const [sessionKey, setSessionKey] = useState<string>(() => {
    return localStorage.getItem(SESSION_KEY_STORAGE) || "";
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: dbMessages, isLoading: loadingMessages } = trpc.notebook.getMessages.useQuery(
    { sessionKey },
    { enabled: !!sessionKey, refetchOnWindowFocus: false }
  );

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const getOrCreateSession = trpc.notebook.getOrCreateSession.useMutation({
    onSuccess: (session) => {
      if (session) {
        setCurrentSession(session as Session);
        setSessionKey(session.sessionKey);
        localStorage.setItem(SESSION_KEY_STORAGE, session.sessionKey);
      }
    },
  });

  const chatMutation = trpc.notebook.chat.useMutation({
    onSuccess: (data) => {
      if (data) {
        const assistantMsg: Message = {
          role: "assistant",
          content: data.content,
          sources: data.sources as Message["sources"],
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
        utils.notebook.getMessages.invalidate({ sessionKey });
      }
    },
    onError: (err) => {
      setIsTyping(false);
      const errorMsg: Message = {
        role: "assistant",
        content: `عذراً، حدث خطأ: ${err.message}`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  const deleteSession = trpc.notebook.deleteSession.useMutation({
    onSuccess: () => {
      localStorage.removeItem(SESSION_KEY_STORAGE);
      setSessionKey("");
      setMessages([]);
      setCurrentSession(null);
    },
  });

  // ── Effects ───────────────────────────────────────────────────────────────────

  // Initialize session on mount
  useEffect(() => {
    if (!sessionKey) {
      getOrCreateSession.mutate({ sessionKey: undefined });
    } else {
      getOrCreateSession.mutate({ sessionKey });
    }
  }, []);

  // Sync DB messages to local state
  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      const mapped: Message[] = dbMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources ? JSON.parse(m.sources) : undefined,
        createdAt: m.createdAt,
      }));
      setMessages(mapped);
    }
  }, [dbMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || !sessionKey) return;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    chatMutation.mutate({
      sessionKey,
      message: trimmed,
      language: "ar",
    });
  }, [input, isTyping, sessionKey, chatMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    getOrCreateSession.mutate({ sessionKey: undefined });
    setMessages([]);
  };

  const handleClearChat = () => {
    if (!sessionKey) return;
    deleteSession.mutate({ sessionKey });
  };

  // ── Suggested Questions ───────────────────────────────────────────────────────

  const suggestions = [
    "ما هي أبرز الأخبار اليوم؟",
    "لخّص لي أهم الأحداث السياسية",
    "ما الأخبار المتعلقة بالاقتصاد؟",
    "ما آخر المستجدات في الشرق الأوسط؟",
    "أخبرني عن أبرز الأحداث الرياضية",
  ];

  // ── Render ────────────────────────────────────────────────────────────────────

  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">ArabiSmart Notebook</h1>
              <p className="text-xs text-muted-foreground">محادثة ذكية مع الأخبار</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="gap-1.5 text-xs"
              disabled={getOrCreateSession.isPending}
            >
              <Plus className="w-3.5 h-3.5" />
              محادثة جديدة
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                disabled={deleteSession.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto px-4 pb-40">
        {/* Empty State */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-700/20 flex items-center justify-center mb-6 border border-violet-500/20">
              <BookOpen className="w-10 h-10 text-violet-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">مرحباً بك في Notebook</h2>
            <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
              اسألني عن أي خبر أو موضوع وسأجيبك بناءً على آخر الأخبار المتاحة في الموقع. يمكنني تلخيص الأحداث، تحليل المواقف، ومقارنة وجهات النظر.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-muted/50 hover:bg-muted text-sm transition-colors text-right"
                >
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading messages */}
        {loadingMessages && (
          <div className="flex justify-center pt-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 pt-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-violet-500 to-purple-700 text-white"
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              {/* Bubble */}
              <div className={cn("flex-1 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/70 border border-border/50 rounded-tl-sm"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                </div>

                {/* Sources */}
                {msg.role === "assistant" && msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Newspaper className="w-3 h-3" />
                      المصادر المستخدمة:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(msg.sources as Array<{ id: number; title: string; source: string }>).map((src) => (
                        <Link key={src.id} href={`/news/${src.id}`}>
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors gap-1 max-w-[200px]"
                          >
                            <span className="truncate">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                {msg.createdAt && (
                  <p className={cn("text-xs text-muted-foreground mt-1", msg.role === "user" ? "text-left" : "text-right")}>
                    {formatDate(msg.createdAt)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/70 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Bar (fixed bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t supports-[backdrop-filter]:bg-background/80">
        {/* Bottom nav spacing */}
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اسألني عن أي خبر أو موضوع..."
                className="resize-none min-h-[48px] max-h-[120px] text-sm pl-4 pr-4 py-3 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
                rows={1}
                dir="rtl"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || !sessionKey}
              size="icon"
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 hover:from-violet-600 hover:to-purple-800 text-white shadow-lg shrink-0"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            اضغط Enter للإرسال • Shift+Enter لسطر جديد
          </p>
        </div>
        {/* Extra spacing for mobile bottom nav */}
        <div className="h-16 md:h-0" />
      </div>
    </div>
  );
}
