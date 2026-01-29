-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "User roles viewable by authenticated users" ON public.user_roles;

-- Create a new policy that only allows users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);