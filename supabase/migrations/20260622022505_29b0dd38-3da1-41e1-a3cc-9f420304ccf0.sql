
ALTER TABLE public.bookings
  ALTER COLUMN data_inicio TYPE timestamptz USING data_inicio::timestamptz,
  ALTER COLUMN data_fim TYPE timestamptz USING data_fim::timestamptz,
  ADD COLUMN IF NOT EXISTS duracao_horas integer,
  ADD COLUMN IF NOT EXISTS valor_total numeric;
