
-- 1) Add logo_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- 2) general_products table
CREATE TABLE public.general_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.general_products TO authenticated;
GRANT ALL ON public.general_products TO service_role;

ALTER TABLE public.general_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own products" ON public.general_products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own products" ON public.general_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own products" ON public.general_products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own products" ON public.general_products FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_general_products_updated_at
BEFORE UPDATE ON public.general_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) sales_history table
CREATE TABLE public.sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  items_sold jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_history TO authenticated;
GRANT ALL ON public.sales_history TO service_role;

ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sales" ON public.sales_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sales" ON public.sales_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sales" ON public.sales_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sales" ON public.sales_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4) Storage bucket for workshop logos
INSERT INTO storage.buckets (id, name, public) VALUES ('workshop_logos', 'workshop_logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop_logos');

CREATE POLICY "Users upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workshop_logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'workshop_logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workshop_logos' AND auth.uid()::text = (storage.foldername(name))[1]);
