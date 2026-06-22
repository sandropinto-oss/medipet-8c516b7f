import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope, Mail, Lock, ArrowRight, User, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRedirectIfAuthenticated } from "@/lib/auth-guard";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — MediPet" },
      { name: "description", content: "Acesse sua conta MediPet e cuide do seu pet com segurança clínica." },
    ],
  }),
  component: LoginPage,
});

type Role = "tutor" | "especialista";

function LoginPage() {
  useRedirectIfAuthenticated();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("tutor");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("access_token")) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/" });
      } else {
        if (!name.trim()) {
          toast.error("Informe seu nome completo.");
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome_completo: name.trim(), tipo_utilizador: role },
          },
        });
        if (error) throw error;
        // If email confirmation is required there's no session — sign in explicitly.
        if (!signUpData.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }
        toast.success("Conta criada! Redirecionando…");
        navigate({ to: role === "especialista" ? "/onboarding" : "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) {
      toast.error("Falha ao entrar com Google.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">MediPet</span>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Hospedagem técnica veterinária para pets que precisam de atenção clínica.
          </h1>
          <p className="text-base text-primary-foreground/85">
            Especialistas verificados, monitoramento em tempo real e um histórico completo do seu pet — tudo em um só lugar.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-6 text-sm text-primary-foreground/80">
          <span>+ 1.200 especialistas</span>
          <span className="h-1 w-1 rounded-full bg-current/50" />
          <span>4.9★ avaliação média</span>
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">MediPet</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Entre para acompanhar a saúde do seu pet."
                : "Cadastre-se para começar a usar o MediPet."}
            </p>
          </div>

          <div className="flex rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Cadastro
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label>Eu sou…</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <RoleOption
                      active={role === "tutor"}
                      onClick={() => setRole("tutor")}
                      icon={<PawPrint className="h-4 w-4" />}
                      title="Tutor"
                      subtitle="Tenho um pet"
                    />
                    <RoleOption
                      active={role === "especialista"}
                      onClick={() => setRole("especialista")}
                      icon={<Stethoscope className="h-4 w-4" />}
                      title="Especialista"
                      subtitle="Vet. / Estudante"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="Seu nome" className="h-11 pl-9"
                      value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="voce@email.com" className="h-11 pl-9"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="h-11 pl-9"
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox defaultChecked /> Lembrar de mim
                </label>
              </div>
            )}
            <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}{" "}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-background px-3 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <Button variant="outline" className="h-11 w-full gap-2" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon /> Continuar com Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            É especialista veterinário?{" "}
            <Link to="/onboarding" className="font-medium text-primary hover:underline">
              Faça o cadastro guiado
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  active, onClick, icon, title, subtitle,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
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
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
