
-- 1) Bookings INSERT: validate especialista_id
DROP POLICY IF EXISTS "Tutors can insert bookings" ON public.bookings;
CREATE POLICY "Tutors can insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = tutor_id
  AND tutor_id <> especialista_id
  AND EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.id = especialista_id
      AND p.tipo_utilizador = 'especialista'
  )
);

-- 2) Bookings UPDATE: pin immutable columns
DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;
CREATE POLICY "Participants can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = tutor_id OR auth.uid() = especialista_id)
WITH CHECK (
  (auth.uid() = tutor_id OR auth.uid() = especialista_id)
  AND tutor_id        = (SELECT b.tutor_id        FROM public.bookings b WHERE b.id = bookings.id)
  AND especialista_id = (SELECT b.especialista_id FROM public.bookings b WHERE b.id = bookings.id)
  AND pet_id IS NOT DISTINCT FROM (SELECT b.pet_id FROM public.bookings b WHERE b.id = bookings.id)
);

-- 3) Perfis UPDATE: prevent role/email escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.perfis;
CREATE POLICY "Users can update own profile"
ON public.perfis
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND tipo_utilizador = (SELECT p.tipo_utilizador FROM public.perfis p WHERE p.id = auth.uid())
  AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.perfis p WHERE p.id = auth.uid())
);

-- 4) Realtime: restrict broadcast/presence subscriptions to booking participants
-- Topic convention enforced going forward: 'booking:<uuid>'
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking participants can read realtime" ON realtime.messages;
CREATE POLICY "Booking participants can read realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'booking:%'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = split_part(realtime.topic(), ':', 2)
      AND (b.tutor_id = auth.uid() OR b.especialista_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Booking participants can write realtime" ON realtime.messages;
CREATE POLICY "Booking participants can write realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'booking:%'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = split_part(realtime.topic(), ':', 2)
      AND (b.tutor_id = auth.uid() OR b.especialista_id = auth.uid())
  )
);

-- 5) Lock down SECURITY DEFINER helper functions: revoke from public/anon
REVOKE EXECUTE ON FUNCTION public.get_especialistas_publicos() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_perfil_publico(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_reserva_ativa_tutor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_especialistas_publicos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_perfil_publico(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reserva_ativa_tutor() TO authenticated;
