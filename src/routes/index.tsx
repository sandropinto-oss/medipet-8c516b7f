import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  FileHeart,
  CalendarPlus,
  MessageSquare,
  MapPin,
  ChevronRight,
  Shield,
  Activity,
  Stethoscope,
  PawPrint,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { SpecialistsMap, type MapSpecialist } from "@/components/specialists-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getInitials } from "@/lib/storage";

interface SpecialistRow {
  id: string;
  nome_completo: string;
  especialidades: string[];
  latitude: number | null;
  longitude: number | null;
  preco_diaria: number | null;
  distanceKm?: number | null;
}

interface ActiveBooking {
  id: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  counterpart_name: string;
  counterpart_initials: string;
}

interface ActiveStay {
  booking_id: string;
  data_inicio: string | null;
  data_fim: string | null;
  especialista_id: string;
  especialista_nome: string;
  especialista_latitude: number;
  especialista_longitude: number;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediPet — Hospedagem técnica veterinária" },
      { name: "description", content: "Encontre especialistas verificados para hospedagem técnica de pets com necessidades clínicas." },
      { property: "og:title", content: "MediPet — Hospedagem técnica veterinária" },
      { property: "og:description", content: "Cuidado clínico, monitoramento em tempo real e especialistas verificados." },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { label: "Buscar cuidador", icon: Search, to: "/buscar" as const },
  { label: "Histórico clínico", icon: FileHeart, to: "/historico" as const },
  { label: "Nova reserva", icon: CalendarPlus, to: "/buscar" as const },
  { label: "Mensagens", icon: MessageSquare, to: "/mensagens" as const },
];

function progressBetween(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return ((now - s) / (e - s)) * 100;
}

function Dashboard() {
  useRequireAuth();
  const { perfil, pets, user, isReady, refresh } = useAuth();
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [specialists, setSpecialists] = useState<SpecialistRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, data_inicio, data_fim, status, tutor_id, especialista_id")
        .or(`tutor_id.eq.${user.id},especialista_id.eq.${user.id}`)
        .in("status", ["confirmada", "pendente"])
        .order("created_at", { ascending: false })
        .limit(1);
      const b = data?.[0];
      if (b) {
        const otherId = b.tutor_id === user.id ? b.especialista_id : b.tutor_id;
        const { data: p } = await supabase.rpc("get_perfil_publico", { _id: otherId });
        const name = (p as { nome_completo: string }[] | null)?.[0]?.nome_completo ?? "Usuário";
        setActiveBooking({
          id: b.id,
          data_inicio: b.data_inicio,
          data_fim: b.data_fim,
          status: b.status,
          counterpart_name: name,
          counterpart_initials: getInitials(name) || "MP",
        });
      }
    })();

    (async () => {
      const { data } = await supabase.rpc("get_especialistas_publicos");
      setSpecialists(((data as SpecialistRow[] | null) ?? []).slice(0, 8));
    })();
  }, [user]);

  if (!isReady || !perfil) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Carregando…
        </div>
      </AppShell>
    );
  }

  const firstName = perfil.nome_completo.split(" ")[0] || "tutor(a)";
  const isSpecialist = perfil.tipo_utilizador === "especialista";
  const pet = pets[0];

  return (
    <AppShell>
      <div className="grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:gap-8 lg:px-8 lg:py-8">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Olá, {firstName} 👋</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isSpecialist ? "Seu painel profissional" : pet ? `Como o ${pet.nome} está hoje?` : "Bem-vindo ao MediPet"}
            </h1>
          </div>

          {isSpecialist && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h2 className="text-xl font-bold">{perfil.nome_completo}</h2>
                    <p className="text-sm text-muted-foreground">
                      CRMV-{perfil.uf ?? "—"} {perfil.crmv ?? ""}
                      {perfil.instituicao ? ` · ${perfil.instituicao}` : ""}
                    </p>
                  </div>
                  {perfil.bio && <p className="text-sm leading-relaxed text-muted-foreground">{perfil.bio}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {perfil.especialidades.map((s: string) => (
                      <span key={s} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isSpecialist && !pet && <NoPetCard onCreated={refresh} />}

          {!isSpecialist && pet && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <PawPrint className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">{pet.nome}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[pet.raca, pet.idade ? `${pet.idade} anos` : null, pet.peso ? `${pet.peso} kg` : null]
                      .filter(Boolean).join(" · ") || "Sem detalhes"}
                  </p>
                  {pet.patologia_cronica && (
                    <span className="mt-2 inline-block rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      {pet.patologia_cronica}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeBooking && (
            <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
                    <span className="grid h-2 w-2 place-items-center rounded-full bg-white">
                      <span className="h-2 w-2 animate-ping rounded-full bg-white/80" />
                    </span>
                    {activeBooking.status === "confirmada" ? "Hospedagem ativa" : "Reserva pendente"}
                  </div>
                  <h2 className="truncate text-xl font-bold sm:text-2xl">Reserva #{activeBooking.id.slice(0, 8)}</h2>
                  <p className="text-sm text-primary-foreground/85">com {activeBooking.counterpart_name}</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-base font-bold backdrop-blur">
                  {activeBooking.counterpart_initials}
                </div>
              </div>
              {activeBooking.data_inicio && activeBooking.data_fim && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-primary-foreground/85">
                      {new Date(activeBooking.data_inicio).toLocaleDateString("pt-BR")} – {new Date(activeBooking.data_fim).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white" style={{ width: `${progressBetween(activeBooking.data_inicio, activeBooking.data_fim)}%` }} />
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/monitoramento">
                  <Button variant="secondary" size="sm" className="bg-white text-primary hover:bg-white/90">
                    <Activity className="mr-1.5 h-4 w-4" /> Monitorar
                  </Button>
                </Link>
                <Link to="/mensagens">
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15">
                    <MessageSquare className="mr-1.5 h-4 w-4" /> Conversar
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {!isSpecialist && <NearbyMap specialists={specialists} />}

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ações rápidas</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.to}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-soft">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold leading-tight">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {!isSpecialist && specialists.length > 0 && (
            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Cuidadores em destaque</h3>
                  <p className="text-sm text-muted-foreground">Especialistas verificados na plataforma</p>
                </div>
                <Link to="/buscar"><Button variant="ghost" size="sm">Ver todos</Button></Link>
              </div>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
                {specialists.map((c) => (
                  <article key={c.id} className="group w-64 shrink-0 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-bold text-primary">
                        {getInitials(c.nome_completo) || "MP"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.nome_completo}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.especialidades?.[0] ?? "Especialista"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(c.especialidades ?? []).slice(0, 3).map((s) => (
                        <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{s}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {c.latitude && c.longitude ? "Geolocalizado" : "Sem local"}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {c.preco_diaria != null ? <>R$ {c.preco_diaria}<span className="text-xs font-normal text-muted-foreground">/dia</span></> : "A combinar"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cuidadores próximos</h3>
              <Link to="/buscar" className="text-xs text-muted-foreground hover:text-primary">Ver todos</Link>
            </div>
            {specialists.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum especialista cadastrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {specialists.slice(0, 3).map((c) => (
                  <Link key={c.id} to="/buscar" className="flex items-center gap-3 rounded-xl border border-border p-2.5 hover:border-primary/40">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(c.nome_completo) || "MP"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.nome_completo}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.especialidades?.[0] ?? "Especialista"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl bg-accent/50 p-3 text-xs text-accent-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Todos os especialistas são verificados pelo CRMV.</span>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function NoPetCard({ onCreated }: { onCreated: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", especie: "Cão", raca: "", idade: "", peso: "", patologia: "", alergias: "" });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("pets").insert({
      tutor_id: user.id,
      nome: form.nome,
      especie: form.especie,
      raca: form.raca || null,
      idade: form.idade ? Number(form.idade) : null,
      peso: form.peso ? Number(form.peso) : null,
      patologia_cronica: form.patologia || null,
      alergias: form.alergias ? form.alergias.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pet cadastrado!");
    setOpen(false);
    await onCreated();
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <PawPrint className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold">Cadastre seu primeiro pet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Para começar a usar o MediPet, registre as informações clínicas do seu pet.</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4"><Plus className="mr-1 h-4 w-4" /> Adicionar pet</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo pet</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Nome</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Espécie</Label><Input value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })} /></div>
              <div><Label>Raça</Label><Input value={form.raca} onChange={(e) => setForm({ ...form, raca: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Idade (anos)</Label><Input type="number" value={form.idade} onChange={(e) => setForm({ ...form, idade: e.target.value })} /></div>
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} /></div>
            </div>
            <div><Label>Patologia crônica</Label><Input placeholder="Ex.: Insulinoma" value={form.patologia} onChange={(e) => setForm({ ...form, patologia: e.target.value })} /></div>
            <div><Label>Alergias (separe por vírgula)</Label><Input placeholder="Frango, corantes" value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Salvando…" : "Salvar pet"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NearbyMap({ specialists }: { specialists: SpecialistRow[] }) {
  const markers: MapSpecialist[] = specialists
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: s.id,
      name: s.nome_completo,
      latitude: s.latitude!,
      longitude: s.longitude!,
      specialty: s.especialidades?.[0] ?? null,
      pricePerDay: s.preco_diaria,
    }));

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Cuidadores no mapa</h3>
          <p className="text-sm text-muted-foreground">Especialistas geolocalizados próximos a você</p>
        </div>
        <Link to="/buscar"><Button variant="ghost" size="sm">Ver todos</Button></Link>
      </div>
      <div className="h-[280px] overflow-hidden rounded-2xl border border-border shadow-soft">
        <SpecialistsMap specialists={markers} className="h-full w-full" />
      </div>
    </div>
  );
}
