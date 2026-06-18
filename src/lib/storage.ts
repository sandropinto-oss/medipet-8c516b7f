import { medications as defaultMedications } from "@/lib/mock-data";

const ONBOARDING_KEY = "medipet_onboarding";

export interface OnboardingProfile {
  name: string;
  bio: string;
  email: string;
  password: string;
}

export interface OnboardingCredentials {
  crmv: string;
  uf: string;
  matricula: string;
  inst: string;
}

export interface OnboardingDraft {
  step: number;
  profile: OnboardingProfile;
  credentials: OnboardingCredentials;
  specialties: string[];
  documents: { name: string; size: string; url?: string }[];
}

export interface MedicationTask {
  time: string;
  name: string;
  dose: string;
  done: boolean;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const defaultOnboardingDraft = (): OnboardingDraft => ({
  step: 1,
  profile: { name: "", bio: "", email: "", password: "" },
  credentials: { crmv: "", uf: "", matricula: "", inst: "" },
  specialties: [],
  documents: [],
});

export function getOnboardingDraft(): OnboardingDraft {
  return readJson(ONBOARDING_KEY, defaultOnboardingDraft());
}

export function saveOnboardingDraft(draft: OnboardingDraft) {
  writeJson(ONBOARDING_KEY, draft);
}

export function clearOnboardingDraft() {
  if (!isBrowser()) return;
  localStorage.removeItem(ONBOARDING_KEY);
}

// ─── Medication Routine (local mock for now) ────────────────────

function medicationKey() {
  const today = new Date().toISOString().split("T")[0];
  return `medipet_medications_${today}`;
}

export function getMedicationTasks(): MedicationTask[] {
  const stored = readJson<MedicationTask[] | null>(medicationKey(), null);
  if (stored) return stored;
  return defaultMedications.map((m) => ({ ...m }));
}

export function saveMedicationTasks(tasks: MedicationTask[]) {
  writeJson(medicationKey(), tasks);
}

export function toggleMedicationTask(index: number): MedicationTask[] {
  const tasks = getMedicationTasks();
  const updated = tasks.map((t, i) => (i === index ? { ...t, done: !t.done } : t));
  saveMedicationTasks(updated);
  return updated;
}
