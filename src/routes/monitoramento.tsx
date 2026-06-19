import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Check, Clock, AlertCircle, PawPrint, LineChart as LineChartIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { getMedicationTasks, toggleMedicationTask, type MedicationTask } from "@/lib/storage";

export const Route = createFileRoute("/monitoramento")({
  head: () => ({
    meta: [
      { title: "Monitoramento — MediPet" },
      { name: "description", content: "Acompanhe sinais vitais e rotina clínica do seu pet em tempo real." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  useRequireAuth();
  const { pets } = useAuth();
  const pet = pets[0];
  const [tasks, setTasks] = useState<MedicationTask[]>([]);

  useEffect(() => {
    setTasks(getMedicationTasks());
  }, []);

  const completedCount = tasks.filter((t) => t.done).length;
  const nextPendingIndex = tasks.findIndex((t) => !t.done);

  const handleToggle = (index: number) => {
    setTasks(toggleMedicationTask(index));
  };

  return (
    <AppShell>
      <div className="space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monitoramento</h1>
          <p className="text-sm text-muted-foreground">
            {pet ? `Sinais vitais e protocolo clínico de ${pet.nome}` : "Sinais vitais e protocolo clínico do seu pet"}
          </p>
        </div>

        {pet ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <PawPrint className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold">{pet.nome}</h2>
                <p className="text-sm text-muted-foreground">
                  {[pet.raca, pet.idade ? `${pet.idade} anos` : null, pet.peso ? `${pet.peso} kg` : null]
                    .filter(Boolean).join(" · ") || "Sem detalhes cadastrados"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pet.patologia_cronica && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                    {pet.patologia_cronica}
                  </span>
                )}
                {pet.alergias.map((a) => (
                  <span key={a} className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning-foreground">
                    Alergia: {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
            <PawPrint className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Cadastre um pet para iniciar o monitoramento</p>
            <p className="mt-1 text-xs text-muted-foreground">As informações clínicas aparecerão aqui.</p>
          </div>
        )}

        {/* Vital signs empty state — to be populated by IoT/clinical integration */}
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <LineChartIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Sinais vitais em tempo real</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Conecte um sensor clínico ou registre manualmente para visualizar gráficos de glicemia, frequência cardíaca e temperatura.
          </p>
        </div>

        {/* Medication checklist (local persistence) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Rotina de medicamentos</h3>
              <p className="text-sm text-muted-foreground">Sua checklist de hoje</p>
            </div>
            {tasks.length > 0 && (
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {completedCount} de {tasks.length}
              </span>
            )}
          </div>
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <Activity className="mx-auto mb-2 h-6 w-6" />
              Nenhuma medicação cadastrada ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((m, i) => (
                <button
                  key={`${m.time}-${m.name}`}
                  type="button"
                  onClick={() => handleToggle(i)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-colors hover:border-primary/40",
                    m.done ? "border-border bg-muted/40" : "border-border bg-card",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                      m.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {m.done ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate text-sm font-semibold", m.done && "text-muted-foreground line-through")}>
                        {m.name}
                      </p>
                      <span className="text-xs text-muted-foreground">· {m.dose}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.time}</p>
                  </div>
                  {!m.done && i === nextPendingIndex && (
                    <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
                      <AlertCircle className="h-3 w-3" /> Em breve
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
