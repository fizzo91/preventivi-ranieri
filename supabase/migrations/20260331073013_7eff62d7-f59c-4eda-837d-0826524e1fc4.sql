
CREATE TABLE public.calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  expression text NOT NULL,
  result text NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calculations"
  ON public.calculations
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX idx_calculations_quote_id ON public.calculations(quote_id);
