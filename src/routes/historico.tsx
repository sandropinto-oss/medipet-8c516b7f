import { createFileRoute } from "@tanstack/react-router";
import { FileHeart, ChevronRight, Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { history } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — MediPet" },
      { name: "description", content: "Veja o histórico completo de hospedagens e atendimentos clínicos do seu pet." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <AppShell>
      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Histórico clínico</h1>
          <p className="text-sm text-muted-foreground">Todas as hospedagens e atendimentos do Theo</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Hospedagens" value="12" />
          <SummaryStat label="Especialistas" value="5" />
          <SummaryStat label="Dias monitorados" value="48" />
        </div>

        <div className="space-y-3">
          {history.map((h) => (
            <article
              key={h.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:border-primary/40"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <FileHeart className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{h.title}</h3>
                <p className="truncate text-sm text-muted-foreground">com {h.specialist}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {h.date}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    h.status === "Em andamento"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {h.status}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
