
-- Sales table for spare parts / modules sales notes
CREATE TABLE IF NOT EXISTS public.parts_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL DEFAULT 'Consumidor Final',
  payment_method text NOT NULL DEFAULT 'Efectivo',
  items_sold jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_sales TO authenticated;
GRANT ALL ON public.parts_sales TO service_role;

ALTER TABLE public.parts_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own parts sales" ON public.parts_sales
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Receipt customization (one row per user)
CREATE TABLE IF NOT EXISTS public.receipt_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url text,
  bg_color text NOT NULL DEFAULT '#ffffff',
  accent_color text NOT NULL DEFAULT '#ec4899',
  text_color text NOT NULL DEFAULT '#0f172a',
  font_family text NOT NULL DEFAULT 'monospace',
  header_text text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT 'Gracias por su compra',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipt_settings TO authenticated;
GRANT ALL ON public.receipt_settings TO service_role;

ALTER TABLE public.receipt_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own receipt settings" ON public.receipt_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER receipt_settings_updated_at
  BEFORE UPDATE ON public.receipt_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
