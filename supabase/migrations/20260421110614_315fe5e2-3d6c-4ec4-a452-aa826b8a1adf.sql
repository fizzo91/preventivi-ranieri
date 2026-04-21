
-- 1) PRODOTTI: rendi visibili a tutti gli autenticati
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

CREATE POLICY "Authenticated can view all products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2) BUG REPORTS
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  title text NOT NULL,
  description text NOT NULL,
  page_url text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own bug reports"
ON public.bug_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports"
ON public.bug_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bug reports"
ON public.bug_reports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bug reports"
ON public.bug_reports FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bug reports"
ON public.bug_reports FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX idx_bug_reports_created_at ON public.bug_reports(created_at DESC);
