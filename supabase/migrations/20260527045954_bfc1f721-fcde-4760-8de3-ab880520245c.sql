
CREATE TABLE public.modules_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  quality text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules_inventory TO authenticated;
GRANT ALL ON public.modules_inventory TO service_role;

ALTER TABLE public.modules_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own modules" ON public.modules_inventory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own modules" ON public.modules_inventory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own modules" ON public.modules_inventory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own modules" ON public.modules_inventory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_modules_inventory_updated_at
  BEFORE UPDATE ON public.modules_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
