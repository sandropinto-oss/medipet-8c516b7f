import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PawPrint, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Pencil, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { tutor, pet } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-guard";
import { getInitials, getSession, getSpecialistProfile, logout, type Session, type SpecialistProfile } from "@/lib/storage";

export const Route = createFileRoute("/perfil")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Perfil — MediPet" },
      { name: "description", content: "Gerencie suas informações, pets e preferências MediPet." },
    ],
  }),
  component: ProfilePage,
});

const menu = [
  { icon: Bell, label: "Notificações", desc: "Avisos clínicos e mensagens" },
  { icon: Shield, label: "Privacidade e segurança", desc: "Senha e autenticação" },
  { icon: CreditCard, label: "Pagamentos", desc: "Cartões e histórico" },
  { icon: HelpCircle, label: "Ajuda e suporte", desc: "FAQ, contato e termos" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [specialist, setSpecialist] = useState<SpecialistProfile | null>(null);

  useEffect(() => {
    const current = getSession();
    setSessionState(current);
    if (current?.userType === "especialista") {
      setSpecialist(getSpecialistProfile());
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const displayName = specialist?.name ?? session?.name ?? tutor.name;
  const displayInitials = getInitials(displayName) || tutor.initials;
  const displayRole =
    session?.userType === "especialista"
      ? `Especialista · CRMV-${specialist?.uf || "—"} ${specialist?.crmv || ""}`
      : `Tutora · ${tutor.city}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-card">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/15 text-xl font-bold backdrop-blur">
              {displayInitials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">{displayName}</h1>
              <p className="truncate text-sm text-primary-foreground/85">{displayRole}</p>
            </div>
            <Button variant="secondary" size="sm" className="bg-white/15 text-white hover:bg-white/25">
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
            </Button>
          </div>
        </div>

        {/* Specialist professional info */}
        {session?.userType === "especialista" && specialist && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Perfil profissional
            </h2>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              {specialist.bio && (
                <p className="text-sm leading-relaxed text-muted-foreground">{specialist.bio}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="CRMV" value={`${specialist.uf}-${specialist.crmv}`} />
                {specialist.matricula && (
                  <InfoItem label="Matrícula" value={specialist.matricula} />
                )}
                {specialist.inst && <InfoItem label="Instituição" value={specialist.inst} />}
                <InfoItem label="E-mail" value={specialist.email} />
              </div>
              {specialist.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {specialist.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pet card — tutors only */}
        {session?.userType !== "especialista" && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Meus pets
            </h2>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <PawPrint className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold">{pet.name}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {pet.breed} · {pet.age} · {pet.weight}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      {pet.condition}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </section>
        )}

        {/* Specialist quick stats */}
        {session?.userType === "especialista" && specialist && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Documentos enviados
            </h2>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{specialist.documents.length} documentos verificados</p>
                  <p className="text-xs text-muted-foreground">
                    {specialist.documents.map((d) => d.name).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Menu */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Conta
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {menu.map((m, i) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.label}
                  className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40 ${
                    i < menu.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>

        <p className="text-center text-[11px] text-muted-foreground">MediPet · v1.0.0</p>
      </div>
    </AppShell>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
