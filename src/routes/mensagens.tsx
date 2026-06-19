import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Search, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens — MediPet" },
      { name: "description", content: "Converse com seu especialista e a equipe MediPet em tempo real." },
    ],
  }),
  component: MessagesPage,
});

interface Conversation {
  bookingId: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatar: string | null;
}

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function MessagesPage() {
  useRequireAuth();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations from bookings
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingConvs(true);
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, tutor_id, especialista_id, created_at")
        .or(`tutor_id.eq.${user.id},especialista_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Não foi possível carregar conversas.");
        setLoadingConvs(false);
        return;
      }
      const rows = bookings ?? [];
      const convs = await Promise.all(
        rows.map(async (b) => {
          const counterpartId = b.tutor_id === user.id ? b.especialista_id : b.tutor_id;
          const { data: p } = await supabase.rpc("get_perfil_publico", { _id: counterpartId });
          const profile = (p as { id: string; nome_completo: string; avatar_url: string | null }[] | null)?.[0];
          return {
            bookingId: b.id,
            counterpartId,
            counterpartName: profile?.nome_completo || "Usuário",
            counterpartAvatar: profile?.avatar_url ?? null,
          } satisfies Conversation;
        }),
      );
      setConversations(convs);
      setActiveId((prev) => prev ?? convs[0]?.bookingId ?? null);
      setLoadingConvs(false);
    })();
  }, [user]);

  // Load messages + subscribe to realtime for active conversation
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", activeId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Erro ao carregar mensagens.");
        return;
      }
      setMessages((data as Message[]) ?? []);
    })();

    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.bookingId === activeId) ?? null,
    [conversations, activeId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.counterpartName.toLowerCase().includes(q));
  }, [conversations, search]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !user || !activeId || sending) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ booking_id: activeId, sender_id: user.id, content: text });
    setSending(false);
    if (error) {
      toast.error("Falha ao enviar mensagem.");
      return;
    }
    setInput("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <div className="grid gap-4 px-4 py-6 lg:h-[calc(100vh-4rem)] lg:grid-cols-[340px_1fr] lg:gap-0 lg:px-0 lg:py-0">
        <aside className="space-y-3 lg:border-r lg:border-border lg:p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mensagens</h1>
            <p className="text-xs text-muted-foreground">
              {loadingConvs ? "Carregando…" : `${conversations.length} ${conversations.length === 1 ? "conversa" : "conversas"}`}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-10 pl-9"
            />
          </div>

          {!loadingConvs && conversations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Nenhuma conversa ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Suas conversas aparecem aqui após criar ou receber uma reserva.
              </p>
            </div>
          )}

          <div className="space-y-1">
            {filtered.map((c) => (
              <button
                key={c.bookingId}
                onClick={() => setActiveId(c.bookingId)}
                className={cn(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl p-3 text-left transition-colors",
                  c.bookingId === activeId ? "bg-accent" : "hover:bg-muted/60",
                )}
              >
                {c.counterpartAvatar ? (
                  <img src={c.counterpartAvatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(c.counterpartName) || "MP"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.counterpartName}</p>
                  <p className="truncate text-xs text-muted-foreground">Reserva #{c.bookingId.slice(0, 8)}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex min-h-[60vh] flex-col lg:min-h-0">
          {activeConv ? (
            <>
              <header className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
                <div className="flex items-center gap-3">
                  {activeConv.counterpartAvatar ? (
                    <img src={activeConv.counterpartAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {getInitials(activeConv.counterpartName) || "MP"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{activeConv.counterpartName}</p>
                    <p className="text-xs text-muted-foreground">Reserva #{activeConv.bookingId.slice(0, 8)}</p>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-6 lg:px-6">
                {messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                    Envie a primeira mensagem desta conversa.
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft",
                            mine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md bg-card text-foreground",
                          )}
                        >
                          {m.content}
                        </div>
                        <span className="px-1 text-[10px] text-muted-foreground">{formatTime(m.created_at)}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="border-t border-border bg-background p-4">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Escreva uma mensagem..."
                    disabled={sending}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !input.trim()}
                    className="h-9 w-9 shrink-0 rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-6 py-12 text-center">
              <div>
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">Selecione uma conversa</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suas conversas com tutores e especialistas aparecem aqui.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
