
-- Fornitori
CREATE TABLE public.fornitori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ragione_sociale text NOT NULL,
  piva text,
  referente text,
  telefono text,
  email text,
  categoria text,
  pagamento_default text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fornitori ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fornitori" ON public.fornitori
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_fornitori_updated_at BEFORE UPDATE ON public.fornitori
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Counters
CREATE TABLE public.counters (
  chiave text PRIMARY KEY,
  valore integer NOT NULL DEFAULT 0
);
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read counters" ON public.counters
  FOR SELECT TO authenticated USING (true);
INSERT INTO public.counters (chiave, valore) VALUES ('oda_counter', 0)
  ON CONFLICT (chiave) DO NOTHING;

-- Ordini acquisto
CREATE TABLE public.ordini_acquisto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero_oda integer NOT NULL,
  progetto_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  fornitore_id uuid REFERENCES public.fornitori(id) ON DELETE SET NULL,
  stato text NOT NULL DEFAULT 'bozza',
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ordini_acquisto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ordini" ON public.ordini_acquisto
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ordini_progetto ON public.ordini_acquisto(progetto_id);
CREATE INDEX idx_ordini_fornitore ON public.ordini_acquisto(fornitore_id);
CREATE TRIGGER update_ordini_acquisto_updated_at BEFORE UPDATE ON public.ordini_acquisto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ODA righe
CREATE TABLE public.oda_righe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  oda_id uuid NOT NULL REFERENCES public.ordini_acquisto(id) ON DELETE CASCADE,
  descrizione text NOT NULL,
  quantita numeric NOT NULL DEFAULT 1,
  prezzo_unitario numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.oda_righe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own oda righe" ON public.oda_righe
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_oda_righe_oda ON public.oda_righe(oda_id);

-- RPC atomico
CREATE OR REPLACE FUNCTION public.incrementa_oda_counter()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.counters SET valore = valore + 1
  WHERE chiave = 'oda_counter'
  RETURNING valore;
$$;
