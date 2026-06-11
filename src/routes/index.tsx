import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  FileHeart,
  CalendarPlus,
  MessageSquare,
  Star,
  MapPin,
  ChevronRight,
  Heart,
  Shield,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { activeStay, caregivers, tutor, pet } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediPet — Hospedagem técnica veterinária" },
      {
        name: "description",
        content:
          "Encontre especialistas verificados para hospedagem técnica de pets com necessidades clínicas.",
      },
      { property: "og:title", content: "MediPet — Hospedagem técnica veterinária" },
      {
        property: "og:description",
        content: "Cuidado clínico, monitoramento em tempo real e especialistas verificados.",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { label: "Buscar cuidador", icon: Search, to: "/" as const },
  { label: "Histórico clínico", icon: FileHeart, to: "/historico" as const },
  { label: "Nova reserva", icon: CalendarPlus, to: "/" as const },
  { label: "Mensagens", icon: MessageSquare, to: "/mensagens" as const },
];

function Dashboard() {
  const progress = (activeStay.dayCurrent / activeStay.dayTotal) * 100;
  return (
    <AppShell>
      <div className="grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:gap-8 lg:px-8 lg:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <p className="text-sm text-muted-foreground">Olá, {tutor.name.split(" ")[0]} 👋</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Como o {pet.name} está hoje?
            </h1>
          </div>

          {/* Active stay card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
                  <span className="grid h-2 w-2 place-items-center rounded-full bg-white">
                    <span className="h-2 w-2 animate-ping rounded-full bg-white/80" />
                  </span>
                  Hospedagem ativa
                </div>
                <h2 className="truncate text-xl font-bold sm:text-2xl">{activeStay.condition}</h2>
                <p className="text-sm text-primary-foreground/85">
                  com {activeStay.specialist}
                </p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-base font-bold backdrop-blur">
                {activeStay.specialistInitials}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-primary-foreground/85">
                  Dia {activeStay.dayCurrent} de {activeStay.dayTotal}
                </span>
                <span className="text-xs text-primary-foreground/75">
                  Retorno: {activeStay.checkOut}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
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

          {/* Quick actions */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Ações rápidas
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    to={a.to}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-soft"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold leading-tight">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Featured caregivers */}
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Cuidadores em destaque</h3>
                <p className="text-sm text-muted-foreground">Especialistas verificados perto de você</p>
              </div>
              <button className="hidden text-sm font-medium text-primary hover:underline sm:block">
                Ver todos
              </button>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
              {caregivers.map((c) => (
                <article
                  key={c.id}
                  className="group w-64 shrink-0 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-bold text-primary">
                      {c.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span className="font-medium text-foreground">{c.rating}</span>
                        <span>({c.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.specialties.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.distanceKm} km
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      R$ {c.pricePerDay}
                      <span className="text-xs font-normal text-muted-foreground">/dia</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Map panel (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cuidadores próximos</h3>
              <span className="text-xs text-muted-foreground">{tutor.city}</span>
            </div>
            <MapMock />
            <div className="space-y-2">
              {caregivers.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.distanceKm} km · R$ {c.pricePerDay}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
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

function MapMock() {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50">
      {/* fake map grid */}
      <svg className="absolute inset-0 h-full w-full text-emerald-200/60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <path d="M 0 110 Q 100 70 200 130 T 400 100" stroke="oklch(0.7 0.08 200)" strokeWidth="3" fill="none" opacity="0.4" />
        <path d="M 60 0 L 80 220" stroke="oklch(0.7 0.08 200)" strokeWidth="2.5" fill="none" opacity="0.35" />
      </svg>
      {/* Pins */}
      <Pin x="22%" y="35%" label="AP" primary />
      <Pin x="55%" y="55%" label="RM" />
      <Pin x="72%" y="28%" label="JF" />
      <Pin x="40%" y="75%" label="LP" />
      {/* Self */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="grid h-4 w-4 place-items-center rounded-full bg-primary ring-4 ring-primary/30">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

function Pin({ x, y, label, primary }: { x: string; y: string; label: string; primary?: boolean }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: x, top: y }}>
      <div
        className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold shadow-card ${
          primary ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
        }`}
      >
        {label}
      </div>
      <div
        className={`mx-auto -mt-0.5 h-2 w-2 rotate-45 ${primary ? "bg-primary" : "bg-card border-r border-b border-border"}`}
      />
    </div>
  );
}
