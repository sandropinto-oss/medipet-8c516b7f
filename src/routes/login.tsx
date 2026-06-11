import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Stethoscope, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — MediPet" },
      { name: "description", content: "Acesse sua conta MediPet e cuide do seu pet com segurança clínica." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
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

      {/* Form */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">MediPet</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre para acompanhar a saúde do seu pet.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="voce@email.com" className="pl-9 h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9 h-11" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox defaultChecked /> Lembrar de mim
              </label>
              <a className="text-sm font-medium text-primary hover:underline" href="#">
                Esqueci a senha
              </a>
            </div>
            <Button type="submit" className="h-11 w-full text-sm font-semibold">
              Entrar <ArrowRight className="ml-1 h-4 w-4" />
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

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11 gap-2">
              <GoogleIcon /> Google
            </Button>
            <Button variant="outline" className="h-11 gap-2">
              <AppleIcon /> Apple
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            É especialista veterinário?{" "}
            <Link to="/onboarding" className="font-medium text-primary hover:underline">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
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
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M16.37 12.62c-.02-2.18 1.78-3.22 1.86-3.27-1.01-1.48-2.59-1.69-3.16-1.71-1.34-.14-2.62.79-3.31.79-.69 0-1.74-.77-2.86-.75-1.47.02-2.83.86-3.59 2.17-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.74 2.19 1.1-.04 1.52-.71 2.85-.71s1.71.71 2.87.69c1.19-.02 1.94-1.07 2.67-2.13.84-1.22 1.19-2.41 1.21-2.47-.03-.01-2.32-.89-2.34-3.52ZM14.2 6.16c.6-.74 1.01-1.76.9-2.77-.87.04-1.93.58-2.55 1.31-.56.64-1.05 1.69-.92 2.68.97.08 1.96-.49 2.57-1.22Z"/>
    </svg>
  );
}
