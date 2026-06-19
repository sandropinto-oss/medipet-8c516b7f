
-- Lock down perfis SELECT to the owner only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.perfis;

CREATE POLICY "Users can view own profile"
  ON public.perfis FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Public-safe specialist discovery via SECURITY DEFINER function.
-- Returns only non-sensitive fields; never exposes email, crmv, matricula,
-- instituicao, documentos.
CREATE OR REPLACE FUNCTION public.get_especialistas_publicos()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  bio text,
  especialidades text[],
  avatar_url text,
  latitude double precision,
  longitude double precision,
  preco_diaria numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome_completo, bio, especialidades, avatar_url,
         latitude, longitude, preco_diaria
  FROM public.perfis
  WHERE tipo_utilizador = 'especialista';
$$;

GRANT EXECUTE ON FUNCTION public.get_especialistas_publicos() TO authenticated;

-- Allow booking participants to look up the counterpart's display name via a
-- minimal SECURITY DEFINER lookup (so reservas screen can show names without
-- granting broad SELECT on perfis).
CREATE OR REPLACE FUNCTION public.get_perfil_publico(_id uuid)
RETURNS TABLE (id uuid, nome_completo text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome_completo, avatar_url
  FROM public.perfis
  WHERE id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.get_perfil_publico(uuid) TO authenticated;
