import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileHeart, ChevronRight, Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
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

interface BookingRow {
  id: string;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
  pet_id: string | null;
  tutor_id: string;
  especialista_id: string;
}

function statusLabel(s: string) {
  if (s === "pendente") return "Pendente";
  if (s === "confirmada") return "Em andamento";
  if (s === "concluida") return "Concluído";
  if (s === "cancelada") return "Cancelado";
  return s;
}

function formatRange(a: string | null, b: string | null) {
  if (!a && !b) return "Sem datas";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (a && b) return `${fmt(a)} – ${fmt(b)}`;
  return fmt((a || b) as string);
}

function HistoryPage() {
  useRequireAuth();
  const { user } = useAuth();
  const [items, setItems] = useState<{ row: BookingRow; counterpart: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .or(`tutor_id.eq.${user.id},especialista_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      const rows = (data as BookingRow[] | null) ?? [];
      const enriched = await Promise.all(
        rows.map(async (r) => {
          const otherId = r.tutor_id === user.id ? r.especialista_id : r.tutor_id;
          const { data: p } = await supabase.rpc("get_perfil_publico", { _id: otherId });
          const name = (p as { nome_completo: string }[] | null)?.[0]?.nome_completo ?? "Usuário";
          return { row: r, counterpart: name };
        }),
      );
      setItems(enriched);
      setLoading(false);
    })();
  }, [user]);

  const totalStays = items.length;
  const uniqueSpecialists = new Set(
    items.map((i) => (i.row.tutor_id === user?.id ? i.row.especialista_id : i.row.tutor_id)),
  ).size;
  const completed = items.filter((i) => i.row.status === "concluida").length;

  return (
    <AppShell>
      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Histórico clínico</h1>
          <p className="text-sm text-muted-foreground">Todas as suas hospedagens e atendimentos</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Hospedagens" value={String(totalStays)} />
          <SummaryStat label="Pessoas" value={String(uniqueSpecialists)} />
          <SummaryStat label="Concluídas" value={String(completed)} />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
            <FileHeart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Sem histórico ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">Suas reservas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(({ row, counterpart }) => (
              <article
                key={row.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:border-primary/40"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <FileHeart className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">Reserva #{row.id.slice(0, 8)}</h3>
                  <p className="truncate text-sm text-muted-foreground">com {counterpart}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {formatRange(row.data_inicio, row.data_fim)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      row.status === "confirmada"
                        ? "bg-primary/10 text-primary"
                        : row.status === "cancelada"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {statusLabel(row.status)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </article>
            ))}
          </div>
        )}
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
