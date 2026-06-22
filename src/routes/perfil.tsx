import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  PawPrint, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight,
  Camera, Stethoscope, Pencil, Plus, Trash2, MapPin, FileUp, X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth, type Pet, type Perfil } from "@/lib/auth-context";
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

const NOTIF_KEY = "medipet:notifications";
type NotifPrefs = { push: boolean; email: boolean; clinico: boolean; mensagens: boolean };
const defaultNotif: NotifPrefs = { push: true, email: true, clinico: true, mensagens: true };

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
      if (file.size > 5 * 1024 * 1024) throw new Error("Imagem maior que 5MB.");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("medipet-uploads").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("medipet-uploads").createSignedUrl(path, 60 * 60 * 24 * 365);
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
    toast.success("Sessão encerrada.");
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
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-xl font-bold backdrop-blur">{displayInitials}</div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} type="button"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-primary shadow disabled:opacity-60"
                aria-label="Trocar foto">
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
                onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">{displayName}</h1>
              <p className="truncate text-sm text-primary-foreground/85">
                {isSpecialist ? `Especialista · CRMV-${perfil.uf ?? "—"} ${perfil.crmv ?? ""}` : "Tutor(a)"}
              </p>
              {perfil.email && <p className="truncate text-xs text-primary-foreground/70">{perfil.email}</p>}
            </div>
            <EditProfileDialog perfil={perfil} isSpecialist={isSpecialist} />
          </div>
        </div>

        {isSpecialist && (
          <SpecialistProfessional perfil={perfil} />
        )}

        {!isSpecialist && (
          <PetsSection pets={pets} userId={user.id} onChanged={refresh} navigate={navigate} />
        )}

        {isSpecialist && (
          <DocumentsSection perfil={perfil} userId={user.id} onChanged={refresh} />
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conta</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <NotificationsRow />
            <SecurityRow email={perfil.email ?? user.email ?? ""} />
            <PaymentsRow />
            <MenuRow icon={HelpCircle} label="Ajuda e suporte" desc="FAQ, contato e termos" last
              onClick={() => window.open("mailto:suporte@medipet.app?subject=Ajuda%20MediPet", "_blank")} />
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

// -------- Specialist professional info --------
function SpecialistProfessional({ perfil }: { perfil: Perfil }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Perfil profissional</h2>
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        {perfil.bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{perfil.bio}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Adicione uma bio profissional editando seu perfil.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="CRMV" value={`${perfil.uf ?? "—"}-${perfil.crmv ?? "—"}`} />
          {perfil.matricula && <InfoItem label="Matrícula" value={perfil.matricula} />}
          {perfil.instituicao && <InfoItem label="Instituição" value={perfil.instituicao} />}
          <InfoItem label="E-mail" value={perfil.email ?? "—"} />
        </div>
        {perfil.especialidades.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {perfil.especialidades.map((s) => (
              <span key={s} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{s}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// -------- Pets CRUD --------
function PetsSection({
  pets, userId, onChanged, navigate,
}: { pets: Pet[]; userId: string; onChanged: () => Promise<void>; navigate: ReturnType<typeof useNavigate> }) {
  const [editing, setEditing] = useState<Pet | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Meus pets</h2>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>

      {pets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
          <PawPrint className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Nenhum pet cadastrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Cadastre seu primeiro pet para começar.</p>
          <Button onClick={() => setCreating(true)} size="sm" className="mt-4">
            <Plus className="mr-1 h-4 w-4" /> Adicionar pet
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pets.map((pet) => (
            <button key={pet.id} type="button" onClick={() => setEditing(pet)}
              className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-colors hover:bg-muted/40">
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
            </button>
          ))}
        </div>
      )}

      <PetDialog
        open={creating || editing !== null}
        pet={editing}
        userId={userId}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={async () => { setEditing(null); setCreating(false); await onChanged(); }}
        onDeleted={async () => { setEditing(null); await onChanged(); }}
      />
      <button type="button" onClick={() => navigate({ to: "/" })} className="mt-3 text-xs text-muted-foreground underline">
        Voltar ao painel
      </button>
    </section>
  );
}

function PetDialog({
  open, pet, userId, onClose, onSaved, onDeleted,
}: {
  open: boolean; pet: Pet | null; userId: string;
  onClose: () => void; onSaved: () => Promise<void>; onDeleted: () => Promise<void>;
}) {
  const [form, setForm] = useState({ nome: "", especie: "Cão", raca: "", idade: "", peso: "", patologia: "", alergias: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (pet) {
      setForm({
        nome: pet.nome, especie: pet.especie ?? "Cão", raca: pet.raca ?? "",
        idade: pet.idade?.toString() ?? "", peso: pet.peso?.toString() ?? "",
        patologia: pet.patologia_cronica ?? "", alergias: pet.alergias.join(", "),
      });
    } else {
      setForm({ nome: "", especie: "Cão", raca: "", idade: "", peso: "", patologia: "", alergias: "" });
    }
  }, [open, pet]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSaving(true);
    const payload = {
      tutor_id: userId,
      nome: form.nome.trim(),
      especie: form.especie.trim() || null,
      raca: form.raca.trim() || null,
      idade: form.idade ? Number(form.idade) : null,
      peso: form.peso ? Number(form.peso) : null,
      patologia_cronica: form.patologia.trim() || null,
      alergias: form.alergias ? form.alergias.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    const { error } = pet
      ? await supabase.from("pets").update(payload).eq("id", pet.id)
      : await supabase.from("pets").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(pet ? "Pet atualizado!" : "Pet cadastrado!");
    await onSaved();
  };

  const del = async () => {
    if (!pet) return;
    if (!confirm(`Excluir ${pet.nome}? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    const { error } = await supabase.from("pets").delete().eq("id", pet.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pet removido.");
    await onDeleted();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pet ? "Editar pet" : "Novo pet"}</DialogTitle>
          <DialogDescription>Mantenha as informações clínicas do seu pet atualizadas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nome</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Espécie</Label><Input value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })} /></div>
            <div><Label>Raça</Label><Input value={form.raca} onChange={(e) => setForm({ ...form, raca: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Idade (anos)</Label><Input type="number" min="0" value={form.idade} onChange={(e) => setForm({ ...form, idade: e.target.value })} /></div>
            <div><Label>Peso (kg)</Label><Input type="number" step="0.1" min="0" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} /></div>
          </div>
          <div><Label>Patologia crônica</Label><Input placeholder="Ex.: Insulinoma" value={form.patologia} onChange={(e) => setForm({ ...form, patologia: e.target.value })} /></div>
          <div><Label>Alergias (separe por vírgula)</Label><Input placeholder="Frango, corantes" value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} /></div>
          <DialogFooter className="gap-2 sm:gap-2">
            {pet && (
              <Button type="button" variant="ghost" onClick={del} disabled={deleting} className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> {deleting ? "Excluindo…" : "Excluir"}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.nome.trim()}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// -------- Documents (specialists) --------
function DocumentsSection({ perfil, userId, onChanged }: { perfil: Perfil; userId: string; onChanged: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo maior que 10MB."); return; }
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/documentos/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("medipet-uploads").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("medipet-uploads").createSignedUrl(path, 60 * 60 * 24 * 365);
      const docs = [...perfil.documentos, { name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, url: signed?.signedUrl }];
      const { error } = await supabase.from("perfis").update({ documentos: docs }).eq("id", userId);
      if (error) throw error;
      await onChanged();
      toast.success("Documento enviado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (idx: number) => {
    if (!confirm("Remover este documento?")) return;
    const docs = perfil.documentos.filter((_, i) => i !== idx);
    const { error } = await supabase.from("perfis").update({ documentos: docs }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    await onChanged();
    toast.success("Documento removido.");
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documentos</h2>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <FileUp className="mr-1 h-4 w-4" /> {busy ? "Enviando…" : "Enviar"}
        </Button>
        <input ref={inputRef} type="file" hidden accept="application/pdf,image/*"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        {perfil.documentos.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Nenhum documento enviado.</p>
        ) : (
          <ul className="space-y-2">
            {perfil.documentos.map((d, i) => (
              <li key={`${d.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  {d.size && <p className="truncate text-xs text-muted-foreground">{d.size}</p>}
                </div>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary underline">Abrir</a>}
                <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// -------- Edit profile --------
function EditProfileDialog({ perfil, isSpecialist }: { perfil: Perfil; isSpecialist: boolean }) {
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", bio: "", uf: "", crmv: "", matricula: "", instituicao: "",
    especialidades: "", preco: "", latitude: "" as string, longitude: "" as string,
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Fetch fresh values including specialist-only columns not exposed on the Perfil type
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("perfis").select("*").eq("id", user.id).maybeSingle();
      const p = (data ?? perfil) as Perfil & { preco_diaria?: number | null; latitude?: number | null; longitude?: number | null };
      setForm({
        nome: p.nome_completo ?? "",
        bio: p.bio ?? "",
        uf: p.uf ?? "",
        crmv: p.crmv ?? "",
        matricula: p.matricula ?? "",
        instituicao: p.instituicao ?? "",
        especialidades: (p.especialidades ?? []).join(", "),
        preco: p.preco_diaria != null ? String(p.preco_diaria) : "",
        latitude: p.latitude != null ? String(p.latitude) : "",
        longitude: p.longitude != null ? String(p.longitude) : "",
      });
    })();
  }, [open, perfil, user]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocalização não suportada."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
        toast.success("Localização capturada.");
      },
      (err) => { setLocating(false); toast.error(err.message || "Falha ao obter localização."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    if (!user) return;
    if (!form.nome.trim()) { toast.error("Informe seu nome."); return; }
    setSaving(true);
    const base = {
      nome_completo: form.nome.trim(),
      bio: form.bio.trim() || null,
      ...(isSpecialist
        ? {
            uf: form.uf.trim() || null,
            crmv: form.crmv.trim() || null,
            matricula: form.matricula.trim() || null,
            instituicao: form.instituicao.trim() || null,
            especialidades: form.especialidades
              ? form.especialidades.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            preco_diaria: form.preco ? Number(form.preco) : null,
            latitude: form.latitude ? Number(form.latitude) : null,
            longitude: form.longitude ? Number(form.longitude) : null,
          }
        : {}),
    };
    const { error } = await supabase.from("perfis").update(base).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado!");
    await refresh();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/25">
          <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize seus dados públicos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome completo</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div>
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4}
              placeholder={isSpecialist ? "Conte sua experiência e abordagem clínica…" : "Conte um pouco sobre você…"} />
          </div>

          {isSpecialist && (
            <>
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div><Label>UF</Label><Input maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} /></div>
                <div><Label>CRMV</Label><Input value={form.crmv} onChange={(e) => setForm({ ...form, crmv: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Matrícula</Label><Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} /></div>
                <div><Label>Instituição</Label><Input value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} /></div>
              </div>
              <div>
                <Label>Especialidades (separe por vírgula)</Label>
                <Input value={form.especialidades} placeholder="Cardiologia Veterinária, Oncologia Veterinária"
                  onChange={(e) => setForm({ ...form, especialidades: e.target.value })} />
              </div>
              <div>
                <Label>Preço por diária (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Localização da casa</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={useMyLocation} disabled={locating}>
                    <MapPin className="mr-1 h-3.5 w-3.5" /> {locating ? "Obtendo…" : "Usar minha localização"}
                  </Button>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <Input placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                  <Input placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Usada para os tutores te encontrarem no mapa.</p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.nome.trim()}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------- Account rows --------
function NotificationsRow() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultNotif);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...defaultNotif, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const update = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  return (
    <>
      <MenuRow icon={Bell} label="Notificações" desc="Avisos clínicos e mensagens" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>
            <DialogDescription>Escolha quais avisos você deseja receber.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PrefRow label="Push no aplicativo" desc="Alertas em tempo real" checked={prefs.push} onChange={(v) => update("push", v)} />
            <PrefRow label="E-mail" desc="Resumos e confirmações" checked={prefs.email} onChange={(v) => update("email", v)} />
            <PrefRow label="Alertas clínicos" desc="Doses, medicações e exames" checked={prefs.clinico} onChange={(v) => update("clinico", v)} />
            <PrefRow label="Mensagens" desc="Conversas com especialistas e tutores" checked={prefs.mensagens} onChange={(v) => update("mensagens", v)} />
          </div>
          <DialogFooter>
            <Button onClick={() => { toast.success("Preferências salvas."); setOpen(false); }}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrefRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SecurityRow({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  const changePwd = async () => {
    if (pwd.length < 8) { toast.error("Use pelo menos 8 caracteres."); return; }
    if (pwd !== pwd2) { toast.error("As senhas não coincidem."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada!");
    setPwd(""); setPwd2(""); setOpen(false);
  };

  const sendReset = async () => {
    if (!email) { toast.error("E-mail indisponível."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Enviamos um link de redefinição para o seu e-mail.");
  };

  return (
    <>
      <MenuRow icon={Shield} label="Privacidade e segurança" desc="Altere sua senha" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Defina uma nova senha de acesso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nova senha</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
            <div><Label>Confirmar senha</Label><Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} /></div>
            <button type="button" onClick={sendReset} className="text-xs text-primary underline">
              Esqueci minha senha — enviar link por e-mail
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={changePwd} disabled={saving || !pwd}>{saving ? "Salvando…" : "Salvar nova senha"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaymentsRow() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MenuRow icon={CreditCard} label="Pagamentos" desc="Cartões e histórico" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamentos</DialogTitle>
            <DialogDescription>
              A integração de pagamentos está em preparação. Em breve você poderá adicionar cartões e visualizar o histórico aqui.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MenuRow({ icon: Icon, label, desc, onClick, last }: { icon: typeof Bell; label: string; desc: string; onClick: () => void; last?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40 ${last ? "" : "border-b border-border"}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
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
