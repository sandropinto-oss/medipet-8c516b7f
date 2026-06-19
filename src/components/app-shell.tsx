import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  History,
  Activity,
  MessageSquare,
  User,
  Stethoscope,
  Bell,
  LogOut,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { perfil, pets, signOut } = useAuth();

  const displayName = perfil?.nome_completo || "Bem-vindo";
  const displayInitials = getInitials(displayName) || "MP";
  const displaySubtitle =
    perfil?.tipo_utilizador === "especialista"
      ? "Especialista · MediPet"
      : pets[0]?.nome
        ? `Tutor(a) · ${pets[0].nome}`
        : "Tutor(a)";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-sidebar-foreground">MediPet</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Hospedagem clínica
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-accent/50 p-3">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {displayInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displaySubtitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="text-base font-bold">MediPet</span>
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-full bg-accent/60 text-accent-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
        </header>

        <main className="pb-24 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
