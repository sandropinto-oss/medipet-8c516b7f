import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Heart, Droplet, Thermometer, Check, Clock, AlertCircle, PawPrint } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { pet, glucoseData, heartRateData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/lib/auth-guard";
import { getMedicationTasks, toggleMedicationTask, type MedicationTask } from "@/lib/storage";

export const Route = createFileRoute("/monitoramento")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Monitoramento — MediPet" },
      { name: "description", content: "Acompanhe sinais vitais e rotina clínica do seu pet em tempo real." },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
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
          <p className="text-sm text-muted-foreground">Sinais vitais e protocolo clínico do {pet.name}</p>
        </div>

        {/* Pet header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:flex sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <PawPrint className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold">{pet.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {pet.breed} · {pet.age} · {pet.weight}
                </p>
              </div>
            </div>
            <div className="col-span-2 flex flex-wrap gap-1.5 sm:col-span-1">
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                {pet.condition}
              </span>
              {pet.allergies.map((a) => (
                <span key={a} className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning-foreground">
                  Alergia: {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Vital cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <VitalCard icon={Droplet} label="Glicemia" value="92" unit="mg/dL" status="normal" />
          <VitalCard icon={Heart} label="Freq. cardíaca" value="94" unit="bpm" status="normal" />
          <VitalCard icon={Thermometer} label="Temperatura" value="38.6" unit="°C" status="normal" />
          <VitalCard icon={Activity} label="Atividade" value="Moderada" unit="hoje" status="warning" />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Glicemia" subtitle="Últimas 6h · mg/dL" accent="primary">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={glucoseData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="glu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.14 162)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.58 0.14 162)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" vertical={false} />
                <XAxis dataKey="time" stroke="oklch(0.52 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.52 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.92 0.01 220)",
                    boxShadow: "0 8px 24px -8px oklch(0.4 0.05 240 / 0.15)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.58 0.14 162)"
                  strokeWidth={2.5}
                  fill="url(#glu)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Frequência cardíaca" subtitle="Últimas 6h · bpm" accent="destructive">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={heartRateData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 220)" vertical={false} />
                <XAxis dataKey="time" stroke="oklch(0.52 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.52 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.92 0.01 220)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.6 0.22 25)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "oklch(0.6 0.22 25)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Medication timeline */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Rotina de medicamentos</h3>
              <p className="text-sm text-muted-foreground">Hoje · Sex, 12 jun</p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {completedCount} de {tasks.length} concluídos
            </span>
          </div>
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
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        m.done && "text-muted-foreground line-through",
                      )}
                    >
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
        </div>
      </div>
    </AppShell>
  );
}

function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "alert";
}) {
  const statusStyles = {
    normal: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    alert: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className={cn("inline-grid h-9 w-9 place-items-center rounded-xl", statusStyles[status])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3">
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
