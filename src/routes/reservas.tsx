import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "Reservas — MediPet" },
      { name: "description", content: "Acompanhe suas reservas de hospedagem clínica veterinária." },
    ],
  }),
  component: ReservasPage,
});

interface BookingRow {
  id: string;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
  especialista: { nome_completo: string } | null;
  tutor: { nome_completo: string } | null;
}

function ReservasPage() {
  useRequireAuth();
  const { user, perfil } = useAuth();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, data_inicio, data_fim, especialista:especialista_id(nome_completo), tutor:tutor_id(nome_completo)")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data as unknown as BookingRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const isSpecialist = perfil?.tipo_utilizador === "especialista";

  return (
    <AppShell>
      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Minhas reservas</h1>
            <p className="text-sm text-muted-foreground">
              {isSpecialist ? "Solicitações recebidas dos tutores." : "Acompanhe o status das suas hospedagens."}
            </p>
          </div>
          {!isSpecialist && (
            <Link to="/buscar">
              <Button size="sm"><CalendarPlus className="mr-1.5 h-4 w-4" /> Nova reserva</Button>
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma reserva ainda.</p>
              {!isSpecialist && (
                <Link to="/buscar">
                  <Button className="mt-3" size="sm"><Search className="mr-1.5 h-4 w-4" /> Buscar cuidador</Button>
                </Link>
              )}
            </div>
          ) : (
            rows.map((r, i) => (
              <div key={r.id} className={`grid grid-cols-[1fr_auto] gap-4 p-4 ${i < rows.length - 1 ? "border-b border-border" : ""}`}>
                <div>
                  <p className="text-sm font-semibold">
                    {isSpecialist ? r.tutor?.nome_completo : r.especialista?.nome_completo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.data_inicio ? `${r.data_inicio} → ${r.data_fim ?? "?"}` : "Datas a definir"}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: "bg-warning/15 text-warning",
    confirmada: "bg-primary/15 text-primary",
    em_andamento: "bg-accent text-accent-foreground",
    concluida: "bg-muted text-muted-foreground",
    cancelada: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${map[status] ?? "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
