
-- Tighten SELECT policies to user-scoped
DROP POLICY IF EXISTS "Authenticated can view all products" ON public.products;
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can view all quotes" ON public.quotes;
CREATE POLICY "Users can view own quotes" ON public.quotes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Remove overly permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can delete section charts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update section charts" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for section charts" ON storage.objects;

-- Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
