import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  Upload,
  User as UserIcon,
  FileText,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Camera,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  completeSpecialistOnboarding,
  defaultOnboardingDraft,
  getOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/storage";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Cadastro de especialista — MediPet" },
      { name: "description", content: "Torne-se um especialista MediPet em 4 passos simples." },
    ],
  }),
  component: OnboardingPage,
});

const steps = [
  { n: 1, label: "Perfil", icon: UserIcon },
  { n: 2, label: "Credenciais", icon: Stethoscope },
  { n: 3, label: "Especialidades", icon: Check },
  { n: 4, label: "Documentos", icon: FileText },
];

const specialties = [
  "Diabetes",
  "Insuficiência Renal",
  "Cardiopatia",
  "Geriatria",
  "Oncologia",
  "Endocrinologia",
  "Pós-operatório",
  "Neurologia",
  "Dermatologia",
  "Filhotes",
];

function OnboardingPage() {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultOnboardingDraft);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setDraft(getOnboardingDraft());
  }, []);

  const step = draft.step;

  const updateDraft = (partial: Partial<OnboardingDraft>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    saveOnboardingDraft(next);
  };

  const handleContinue = () => {
    setError("");

    if (step === 1) {
      if (!draft.profile.name.trim() || !draft.profile.email.trim() || !draft.profile.password.trim()) {
        setError("Preencha nome, e-mail e senha para continuar.");
        return;
      }
    }

    if (step < 4) {
      updateDraft({ step: step + 1 });
      return;
    }

    const result = completeSpecialistOnboarding(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: "/" });
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      updateDraft({ step: step - 1 });
    } else {
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">MediPet</span>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary bg-background text-primary",
                      !done && !active && "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.n}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1 -translate-y-2.5 rounded-full",
                      step > s.n ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          {step === 1 && (
            <StepProfile
              profile={draft.profile}
              onChange={(profile) => updateDraft({ profile })}
            />
          )}
          {step === 2 && (
            <StepCredentials
              credentials={draft.credentials}
              onChange={(credentials) => updateDraft({ credentials })}
            />
          )}
          {step === 3 && (
            <StepSpecialties
              selected={draft.specialties}
              onChange={(specialties) => updateDraft({ specialties })}
            />
          )}
          {step === 4 && <StepDocs documents={draft.documents} />}

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={handleBack}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <Button onClick={handleContinue} className="min-w-32">
              {step === 4 ? "Finalizar" : "Continuar"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepProfile({
  profile,
  onChange,
}: {
  profile: OnboardingDraft["profile"];
  onChange: (profile: OnboardingDraft["profile"]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Conte sobre você</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas informações ajudam tutores a confiarem em você.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-accent text-accent-foreground">
          <UserIcon className="h-8 w-8" />
          <button
            type="button"
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Adicione uma foto profissional.
          <br /> JPG ou PNG, mín. 400×400.
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          placeholder="Dra. Ana Paula Ribeiro"
          className="h-11"
          value={profile.name}
          onChange={(e) => onChange({ ...profile, name: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="voce@email.com"
              className="h-11 pl-9"
              value={profile.email}
              onChange={(e) => onChange({ ...profile, email: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 pl-9"
              value={profile.password}
              onChange={(e) => onChange({ ...profile, password: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Apresentação profissional</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Conte sua experiência, áreas de atuação e abordagem com pets..."
          value={profile.bio}
          onChange={(e) => onChange({ ...profile, bio: e.target.value })}
        />
      </div>
    </div>
  );
}

function StepCredentials({
  credentials,
  onChange,
}: {
  credentials: OnboardingDraft["credentials"];
  onChange: (credentials: OnboardingDraft["credentials"]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Registro e credenciais</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Validamos suas credenciais para garantir segurança aos tutores.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="crmv">CRMV</Label>
          <Input
            id="crmv"
            placeholder="SP-12345"
            className="h-11"
            value={credentials.crmv}
            onChange={(e) => onChange({ ...credentials, crmv: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="uf">Estado</Label>
          <Input
            id="uf"
            placeholder="SP"
            className="h-11"
            value={credentials.uf}
            onChange={(e) => onChange({ ...credentials, uf: e.target.value })}
          />
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">É estudante de veterinária?</p>
        Preencha sua matrícula e instituição abaixo.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            id="matricula"
            placeholder="2026-001234"
            className="h-11"
            value={credentials.matricula}
            onChange={(e) => onChange({ ...credentials, matricula: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inst">Instituição</Label>
          <Input
            id="inst"
            placeholder="USP / UNESP / UFRJ"
            className="h-11"
            value={credentials.inst}
            onChange={(e) => onChange({ ...credentials, inst: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function StepSpecialties({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (specialties: string[]) => void;
}) {
  const toggle = (s: string) =>
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Suas especialidades</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione todas as condições clínicas com que você tem experiência.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {specialties.map((s) => {
          const on = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                on
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <Checkbox checked={on} className="pointer-events-none" />
              <span className="font-medium">{s}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDocs({ documents }: { documents: OnboardingDraft["documents"] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Upload de documentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carteira do CRMV, certificados de especialização e comprovante de endereço.
        </p>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-10 text-center transition-colors hover:border-primary hover:bg-accent/40">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Arraste arquivos ou clique para enviar</p>
          <p className="mt-0.5 text-xs text-muted-foreground">PDF, JPG, PNG — máx. 5 MB</p>
        </div>
        <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" />
      </label>
      <div className="space-y-2">
        {documents.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="text-xs text-muted-foreground">{f.size}</p>
            </div>
            <Check className="h-4 w-4 text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}
