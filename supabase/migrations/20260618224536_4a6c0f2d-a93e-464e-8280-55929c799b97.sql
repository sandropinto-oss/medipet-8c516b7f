
-- Enum for user type
CREATE TYPE public.user_type AS ENUM ('tutor', 'especialista');

-- Profiles table
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL DEFAULT '',
  tipo_utilizador public.user_type NOT NULL DEFAULT 'tutor',
  email TEXT,
  bio TEXT,
  crmv TEXT,
  uf TEXT,
  matricula TEXT,
  instituicao TEXT,
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  documentos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON public.perfis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.perfis FOR DELETE TO authenticated USING (auth.uid() = id);

-- Pets table
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT,
  raca TEXT,
  idade INT,
  peso NUMERIC,
  patologia_cronica TEXT,
  alergias TEXT[] NOT NULL DEFAULT '{}',
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can view own pets"
  ON public.pets FOR SELECT TO authenticated USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can insert own pets"
  ON public.pets FOR INSERT TO authenticated WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can update own pets"
  ON public.pets FOR UPDATE TO authenticated USING (auth.uid() = tutor_id) WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutors can delete own pets"
  ON public.pets FOR DELETE TO authenticated USING (auth.uid() = tutor_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER perfis_set_updated_at BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome_completo, tipo_utilizador)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'tipo_utilizador')::public.user_type, 'tutor'::public.user_type)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
