import { medications as defaultMedications } from "@/lib/mock-data";

const USERS_KEY = "medipet_users";
const SESSION_KEY = "medipet_session";
const ONBOARDING_KEY = "medipet_onboarding";
const SPECIALIST_PROFILE_KEY = "medipet_specialist_profile";

export type UserType = "tutor" | "especialista";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  userType: UserType;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  userType: UserType;
}

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

export interface SpecialistProfile {
  name: string;
  bio: string;
  email: string;
  crmv: string;
  uf: string;
  matricula: string;
  inst: string;
  specialties: string[];
  documents: { name: string; size: string }[];
}

export interface OnboardingDraft {
  step: number;
  profile: OnboardingProfile;
  credentials: OnboardingCredentials;
  specialties: string[];
  documents: { name: string; size: string }[];
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

// ─── Users & Auth ───────────────────────────────────────────────

export function getUsers(): User[] {
  return readJson<User[]>(USERS_KEY, []);
}

function saveUsers(users: User[]) {
  writeJson(USERS_KEY, users);
}

export function registerUser(data: Omit<User, "id">): { ok: true; user: User } | { ok: false; error: string } {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { ok: false, error: "Este e-mail já está cadastrado." };
  }
  const user: User = { ...data, id: crypto.randomUUID() };
  saveUsers([...users, user]);
  return { ok: true, user };
}

export function loginUser(
  email: string,
  password: string,
): { ok: true; session: Session } | { ok: false; error: string } {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }
  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    userType: user.userType,
  };
  setSession(session);
  return { ok: true, session };
}

export function getSession(): Session | null {
  return readJson<Session | null>(SESSION_KEY, null);
}

export function setSession(session: Session) {
  writeJson(SESSION_KEY, session);
}

export function logout() {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── Specialist Onboarding ──────────────────────────────────────

export const defaultOnboardingDraft = (): OnboardingDraft => ({
  step: 1,
  profile: { name: "", bio: "", email: "", password: "" },
  credentials: { crmv: "", uf: "", matricula: "", inst: "" },
  specialties: ["Diabetes", "Geriatria"],
  documents: [
    { name: "CRMV-SP-12345.pdf", size: "1.2 MB" },
    { name: "Especialização-Endocrino.pdf", size: "2.4 MB" },
  ],
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

export function getSpecialistProfile(): SpecialistProfile | null {
  return readJson<SpecialistProfile | null>(SPECIALIST_PROFILE_KEY, null);
}

export function saveSpecialistProfile(profile: SpecialistProfile) {
  writeJson(SPECIALIST_PROFILE_KEY, profile);
}

export function completeSpecialistOnboarding(draft: OnboardingDraft): { ok: true } | { ok: false; error: string } {
  const result = registerUser({
    email: draft.profile.email,
    password: draft.profile.password,
    name: draft.profile.name,
    userType: "especialista",
  });
  if (!result.ok) return result;

  const profile: SpecialistProfile = {
    name: draft.profile.name,
    bio: draft.profile.bio,
    email: draft.profile.email,
    crmv: draft.credentials.crmv,
    uf: draft.credentials.uf,
    matricula: draft.credentials.matricula,
    inst: draft.credentials.inst,
    specialties: draft.specialties,
    documents: draft.documents,
  };
  saveSpecialistProfile(profile);
  setSession({
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    userType: "especialista",
  });
  clearOnboardingDraft();
  return { ok: true };
}

// ─── Medication Routine ─────────────────────────────────────────

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
