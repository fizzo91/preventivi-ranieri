
-- Drop the existing ALL policy
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.quotes;

-- All authenticated users can VIEW all quotes
CREATE POLICY "Authenticated users can view all quotes"
ON public.quotes
FOR SELECT
TO authenticated
USING (true);

-- Only the owner can INSERT their own quotes
CREATE POLICY "Users can insert own quotes"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only the owner can UPDATE their own quotes
CREATE POLICY "Users can update own quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Only the owner can DELETE their own quotes
CREATE POLICY "Users can delete own quotes"
ON public.quotes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
