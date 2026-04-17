-- Rimuovi policy INSERT generica
DROP POLICY IF EXISTS "Anyone can submit access request" ON public.access_requests;

-- Solo utenti anonimi (non loggati) possono creare richieste
CREATE POLICY "Anonymous users can submit access request"
ON public.access_requests
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND full_name IS NOT NULL
  AND length(trim(full_name)) BETWEEN 2 AND 100
  AND (reason IS NULL OR length(reason) <= 500)
  AND status = 'pending'
);