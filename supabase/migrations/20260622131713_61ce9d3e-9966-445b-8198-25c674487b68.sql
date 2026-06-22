REVOKE EXECUTE ON FUNCTION public.incrementa_oda_counter() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.incrementa_oda_counter() TO authenticated, service_role;

REVOKE INSERT, UPDATE, DELETE ON public.counters FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.counters TO service_role;

CREATE POLICY "No direct writes to counters" ON public.counters FOR ALL TO authenticated USING (false) WITH CHECK (false);