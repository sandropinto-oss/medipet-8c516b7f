CREATE OR REPLACE FUNCTION public.get_reserva_ativa_tutor()
RETURNS TABLE(
  booking_id uuid,
  data_inicio timestamptz,
  data_fim timestamptz,
  status text,
  especialista_id uuid,
  especialista_nome text,
  especialista_avatar text,
  especialista_latitude double precision,
  especialista_longitude double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.data_inicio,
    b.data_fim,
    b.status::text,
    p.id,
    p.nome_completo,
    p.avatar_url,
    p.latitude,
    p.longitude
  FROM public.bookings b
  JOIN public.perfis p ON p.id = b.especialista_id
  WHERE b.tutor_id = auth.uid()
    AND b.status IN ('confirmada', 'em_andamento')
    AND (b.data_inicio IS NULL OR b.data_inicio <= now())
    AND (b.data_fim IS NULL OR b.data_fim >= now())
  ORDER BY b.data_inicio DESC NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_reserva_ativa_tutor() TO authenticated;