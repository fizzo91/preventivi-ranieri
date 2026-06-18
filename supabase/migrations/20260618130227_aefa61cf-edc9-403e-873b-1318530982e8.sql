
DROP INDEX IF EXISTS public.idx_products_category;
DROP INDEX IF EXISTS public.idx_products_subcategory;
DROP INDEX IF EXISTS public.idx_products_archived;
DROP INDEX IF EXISTS public.idx_products_user_code;

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_product_categories" ON public.product_categories;
CREATE POLICY "own_product_categories" ON public.product_categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_product_categories_updated ON public.product_categories;
CREATE TRIGGER trg_product_categories_updated
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.product_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_subcategories TO authenticated;
GRANT ALL ON public.product_subcategories TO service_role;
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_product_subcategories" ON public.product_subcategories;
CREATE POLICY "own_product_subcategories" ON public.product_subcategories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_product_subcategories_updated ON public.product_subcategories;
CREATE TRIGGER trg_product_subcategories_updated
  BEFORE UPDATE ON public.product_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_product_subcategories_category ON public.product_subcategories(category_id);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.product_subcategories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_user_code ON public.products(user_id, code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products(user_id, archived);

INSERT INTO public.product_categories (user_id, name, sort_order)
SELECT DISTINCT user_id, category, 0
FROM public.products
WHERE category IS NOT NULL AND btrim(category) <> ''
ON CONFLICT (user_id, name) DO NOTHING;

UPDATE public.products p
SET category_id = c.id
FROM public.product_categories c
WHERE p.user_id = c.user_id
  AND p.category = c.name
  AND p.category_id IS NULL;
