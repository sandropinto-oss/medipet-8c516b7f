import { createFileRoute } from "@tanstack/react-router";
import { useRequireAuth } from "@/lib/auth-guard";
import { Search, Send, Paperclip } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { messages } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens — MediPet" },
      { name: "description", content: "Converse com seu especialista e a equipe MediPet em tempo real." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  useRequireAuth();
  return (
    <AppShell>
      <div className="grid gap-4 px-4 py-6 lg:h-[calc(100vh-4rem)] lg:grid-cols-[340px_1fr] lg:gap-0 lg:px-0 lg:py-0">
        {/* List */}
        <aside className="space-y-3 lg:border-r lg:border-border lg:p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mensagens</h1>
            <p className="text-xs text-muted-foreground">3 conversas</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="h-10 pl-9" />
          </div>
          <div className="space-y-1">
            {messages.map((m, i) => (
              <button
                key={m.id}
                className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  i === 0 ? "bg-accent" : "hover:bg-muted/60"
                }`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {m.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                  {m.unread > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {m.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Thread */}
        <section className="hidden flex-col lg:flex">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                AP
              </div>
              <div>
                <p className="text-sm font-semibold">Dra. Ana Paula Ribeiro</p>
                <p className="text-xs text-success">● Online · respondendo em minutos</p>
              </div>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Hospedagem ativa
            </span>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 px-6 py-6">
            <Bubble side="them">Olá Mariana! O Theo se adaptou super bem 🐾</Bubble>
            <Bubble side="them">Glicemia matinal estável em 78 mg/dL, almoço aceito 100%.</Bubble>
            <Bubble side="me">Que ótima notícia! Ele tomou o Diazóxido das 12h?</Bubble>
            <Bubble side="them">Sim, tudo certo. Acabei de registrar no app.</Bubble>
            <Bubble side="me">Perfeito, obrigada pelo cuidado! 💚</Bubble>
            <p className="text-center text-[11px] text-muted-foreground">12:42</p>
            <Bubble side="them">Theo se alimentou bem e a glicemia está estável.</Bubble>
          </div>
          <div className="border-t border-border bg-background p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                placeholder="Escreva uma mensagem..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" className="h-9 w-9 shrink-0 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Bubble({ side, children }: { side: "me" | "them"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "me" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-soft ${
          side === "me"
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-card text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
