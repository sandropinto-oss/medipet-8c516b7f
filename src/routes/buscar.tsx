import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Stethoscope, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SpecialistsMap, type MapSpecialist } from "@/components/specialists-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRequireAuth } from "@/lib/auth-guard";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  bio: string | null;
  especialidades: string[];
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  preco_diaria: number | null;
}

type DurationKind = "1h" | "1d" | "2d" | "multi";

/** Pricing rules:
 *  1 hora = R$30 · 1 dia = R$160 · 2 dias = R$230 · 3+ dias = R$100/dia */
function priceFor(kind: DurationKind, days: number): { total: number; label: string; hours: number } {
  if (kind === "1h") return { total: 30, label: "1 hora", hours: 1 };
  if (kind === "1d") return { total: 160, label: "1 dia", hours: 24 };
  if (kind === "2d") return { total: 230, label: "2 dias", hours: 48 };
  const d = Math.max(3, days);
  return { total: d * 100, label: `${d} dias`, hours: d * 24 };
}

function BuscarPage() {
  const { user, isReady } = useRequireAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<SpecialistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SpecialistRow | null>(null);

  useEffect(() => {
    if (!isReady || !user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_especialistas_publicos");
      if (error) toast.error(error.message);
      setList((data as SpecialistRow[] | null) ?? []);
      setLoading(false);
    })();
  }, [isReady, user]);

  const geo = list.filter((s) => s.latitude != null && s.longitude != null);
  const markers: MapSpecialist[] = geo.map((s) => ({
    id: s.id,
    name: s.nome_completo,
    latitude: s.latitude!,
    longitude: s.longitude!,
    specialty: s.especialidades?.[0] ?? null,
    pricePerDay: s.preco_diaria,
  }));

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
                    {s.bio && <p className="line-clamp-2 text-xs text-muted-foreground">{s.bio}</p>}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span>Novo</span>
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
                  <span className="text-xs text-muted-foreground">A partir de <strong className="text-foreground">R$ 30</strong>/hora</span>
                  <Button size="sm" onClick={() => setSelected(s)}>Marcar horário</Button>
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

      <BookingDialog
        specialist={selected}
        onClose={() => setSelected(null)}
        onConfirmed={() => { setSelected(null); navigate({ to: "/reservas" }); }}
        tutorId={user?.id ?? null}
      />
    </AppShell>
  );
}

function BookingDialog({
  specialist, onClose, onConfirmed, tutorId,
}: {
  specialist: SpecialistRow | null;
  onClose: () => void;
  onConfirmed: () => void;
  tutorId: string | null;
}) {
  const [kind, setKind] = useState<DurationKind>("1d");
  const [days, setDays] = useState(3);
  const [startAt, setStartAt] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [submitting, setSubmitting] = useState(false);

  const pricing = useMemo(() => priceFor(kind, days), [kind, days]);

  const handleConfirm = async () => {
    if (!specialist || !tutorId) return;
    setSubmitting(true);
    try {
      const start = new Date(startAt);
      if (isNaN(start.getTime())) throw new Error("Data inválida");
      const end = new Date(start.getTime() + pricing.hours * 3600 * 1000);
      const { error } = await supabase.from("bookings").insert({
        tutor_id: tutorId,
        especialista_id: specialist.id,
        status: "pendente",
        data_inicio: start.toISOString(),
        data_fim: end.toISOString(),
        duracao_horas: pricing.hours,
        valor_total: pricing.total,
      });
      if (error) throw error;
      toast.success(`Reserva criada — ${pricing.label} · R$ ${pricing.total}`);
      onConfirmed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!specialist} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar horário</DialogTitle>
          <DialogDescription>
            {specialist?.nome_completo ? `com ${specialist.nome_completo}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duração</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <DurationButton active={kind === "1h"} onClick={() => setKind("1h")} icon={<Clock className="h-4 w-4" />} title="1 hora" price="R$ 30" />
              <DurationButton active={kind === "1d"} onClick={() => setKind("1d")} icon={<CalendarDays className="h-4 w-4" />} title="1 dia" price="R$ 160" />
              <DurationButton active={kind === "2d"} onClick={() => setKind("2d")} icon={<CalendarDays className="h-4 w-4" />} title="2 dias" price="R$ 230" />
              <DurationButton active={kind === "multi"} onClick={() => setKind("multi")} icon={<CalendarDays className="h-4 w-4" />} title="3+ dias" price="R$ 100/dia" />
            </div>
            {kind === "multi" && (
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="days" className="text-xs">Quantos dias?</Label>
                <Input id="days" type="number" min={3} value={days}
                  onChange={(e) => setDays(Math.max(3, Number(e.target.value) || 3))} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="startAt" className="text-xs uppercase tracking-wider text-muted-foreground">Início</Label>
            <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-accent p-3">
            <div>
              <p className="text-xs text-muted-foreground">{pricing.label}</p>
              <p className="text-lg font-bold">R$ {pricing.total}</p>
            </div>
            <span className="text-xs text-muted-foreground">{pricing.hours}h de estadia</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={submitting || !tutorId}>
            {submitting ? "Reservando…" : "Confirmar reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DurationButton({
  active, onClick, icon, title, price,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; price: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
        active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className={cn("grid h-8 w-8 place-items-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{price}</p>
    </button>
  );
}
