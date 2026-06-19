import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Star, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SpecialistsMap, type MapSpecialist } from "@/components/specialists-map";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar cuidador — MediPet" },
      { name: "description", content: "Encontre especialistas veterinários próximos para hospedagem clínica." },
    ],
  }),
  component: BuscarPage,
});

interface SpecialistRow {
  id: string;
  nome_completo: string;
  especialidades: string[];
  latitude: number | null;
  longitude: number | null;
  preco_diaria: number | null;
  uf: string | null;
  crmv: string | null;
}

function BuscarPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState<SpecialistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome_completo, especialidades, latitude, longitude, preco_diaria, uf, crmv")
        .eq("tipo_utilizador", "especialista");
      if (error) toast.error(error.message);
      setList((data as SpecialistRow[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  const geo = list.filter((s) => s.latitude != null && s.longitude != null);
  const markers: MapSpecialist[] = geo.map((s) => ({
    id: s.id,
    name: s.nome_completo,
    latitude: s.latitude!,
    longitude: s.longitude!,
    specialty: s.especialidades?.[0] ?? null,
    pricePerDay: s.preco_diaria,
  }));

  const startBooking = async (especialistaId: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("bookings")
      .insert({ tutor_id: user.id, especialista_id: especialistaId, status: "pendente" })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Reserva criada — entraremos em contato.");
    navigate({ to: "/mensagens" });
  };

  return (
    <AppShell>
      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Buscar cuidador</h1>
          <p className="text-sm text-muted-foreground">Especialistas verificados com geolocalização em tempo real.</p>
        </div>

        <div className="h-[360px] overflow-hidden rounded-2xl border border-border shadow-soft">
          <SpecialistsMap specialists={markers} className="h-full w-full" />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {loading ? "Carregando…" : `${list.length} especialista(s) disponível(is)`}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((s) => (
              <article key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      CRMV-{s.uf ?? "—"} {s.crmv ?? ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span>4.9 (124)</span>
                      {s.latitude != null && s.longitude != null && (
                        <>
                          <span>·</span>
                          <MapPin className="h-3 w-3" />
                          <span>Geolocalizado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(s.especialidades ?? []).slice(0, 3).map((e) => (
                    <span key={e} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{e}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold">
                    {s.preco_diaria ? <>R$ {s.preco_diaria}<span className="text-xs font-normal text-muted-foreground">/dia</span></> : <span className="text-xs text-muted-foreground">Sob consulta</span>}
                  </span>
                  <Button size="sm" onClick={() => startBooking(s.id)}>Reservar</Button>
                </div>
              </article>
            ))}
            {!loading && list.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum especialista cadastrado ainda. Convide profissionais para se cadastrarem!
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
