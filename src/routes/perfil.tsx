import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PawPrint, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Camera, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getInitials } from "@/lib/storage";

export const Route = createFileRoute("/perfil")({
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
  useRequireAuth();
  const navigate = useNavigate();
  const { perfil, pets, user, refresh, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!perfil || !user) {
    return <AppShell><div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Carregando…</div></AppShell>;
  }

  const isSpecialist = perfil.tipo_utilizador === "especialista";
  const displayName = perfil.nome_completo || "Usuário";
  const displayInitials = getInitials(displayName) || "MP";

  const handleAvatar = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("medipet-uploads")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage
        .from("medipet-uploads")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl;
      if (!url) throw new Error("URL inválida");
      const { error } = await supabase.from("perfis").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-card">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
            <div className="relative">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/30" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-xl font-bold backdrop-blur">
                  {displayInitials}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-primary shadow disabled:opacity-60">
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden
                onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">{displayName}</h1>
              <p className="truncate text-sm text-primary-foreground/85">
                {isSpecialist ? `Especialista · CRMV-${perfil.uf ?? "—"} ${perfil.crmv ?? ""}` : "Tutor(a)"}
              </p>
            </div>
            <span className="text-xs text-primary-foreground/70">{perfil.email}</span>
          </div>
        </div>

        {isSpecialist && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Perfil profissional</h2>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              {perfil.bio && <p className="text-sm leading-relaxed text-muted-foreground">{perfil.bio}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="CRMV" value={`${perfil.uf ?? "—"}-${perfil.crmv ?? "—"}`} />
                {perfil.matricula && <InfoItem label="Matrícula" value={perfil.matricula} />}
                {perfil.instituicao && <InfoItem label="Instituição" value={perfil.instituicao} />}
                <InfoItem label="E-mail" value={perfil.email ?? "—"} />
              </div>
              {perfil.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {perfil.especialidades.map((s: string) => (
                    <span key={s} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {!isSpecialist && pets.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Meus pets</h2>
            <div className="space-y-3">
              {pets.map((pet) => (
                <div key={pet.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                      <PawPrint className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold">{pet.nome}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {[pet.raca, pet.idade ? `${pet.idade} anos` : null, pet.peso ? `${pet.peso} kg` : null].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {pet.patologia_cronica && (
                        <span className="mt-1.5 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          {pet.patologia_cronica}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isSpecialist && perfil.documentos.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documentos enviados</h2>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{perfil.documentos.length} documentos enviados</p>
                  <p className="text-xs text-muted-foreground">{perfil.documentos.map((d) => d.name).join(", ")}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conta</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {menu.map((m, i) => {
              const Icon = m.icon;
              return (
                <button key={m.label}
                  className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40 ${i < menu.length - 1 ? "border-b border-border" : ""}`}>
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

        <button type="button" onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5">
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
