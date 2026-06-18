import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserType = "tutor" | "especialista";

export interface Perfil {
  id: string;
  nome_completo: string;
  tipo_utilizador: UserType;
  email: string | null;
  bio: string | null;
  crmv: string | null;
  uf: string | null;
  matricula: string | null;
  instituicao: string | null;
  especialidades: string[];
  avatar_url: string | null;
  documentos: { name: string; size?: string; url?: string }[];
}

export interface Pet {
  id: string;
  tutor_id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  idade: number | null;
  peso: number | null;
  patologia_cronica: string | null;
  alergias: string[];
  foto_url: string | null;
}

interface AuthCtx {
  user: User | null;
  perfil: Perfil | null;
  pets: Pet[];
  isReady: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadData = useCallback(async (uid: string) => {
    const [{ data: p }, { data: ps }] = await Promise.all([
      supabase.from("perfis").select("*").eq("id", uid).maybeSingle(),
      supabase.from("pets").select("*").eq("tutor_id", uid).order("created_at"),
    ]);
    setPerfil((p as Perfil | null) ?? null);
    setPets((ps as Pet[] | null) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    if (user) await loadData(user.id);
  }, [user, loadData]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        loadData(u.id).finally(() => mounted && setIsReady(true));
      } else {
        setIsReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Defer to avoid deadlock
        setTimeout(() => {
          loadData(u.id);
        }, 0);
      } else {
        setPerfil(null);
        setPets([]);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setPets([]);
  }, []);

  return (
    <Ctx.Provider value={{ user, perfil, pets, isReady, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
