
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS preco_diaria numeric;

CREATE TYPE public.booking_status AS ENUM ('pendente', 'confirmada', 'em_andamento', 'concluida', 'cancelada');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  especialista_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  status public.booking_status NOT NULL DEFAULT 'pendente',
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = tutor_id OR auth.uid() = especialista_id);

CREATE POLICY "Tutors can insert bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Participants can update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = tutor_id OR auth.uid() = especialista_id)
  WITH CHECK (auth.uid() = tutor_id OR auth.uid() = especialista_id);

CREATE POLICY "Tutors can delete bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (auth.uid() = tutor_id);

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
