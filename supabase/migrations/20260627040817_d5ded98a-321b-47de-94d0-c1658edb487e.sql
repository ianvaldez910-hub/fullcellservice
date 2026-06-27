
-- parts_sales
CREATE TABLE IF NOT EXISTS public.parts_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL DEFAULT 'Consumidor Final',
  payment_method TEXT NOT NULL DEFAULT 'Efectivo',
  items_sold JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_sales TO authenticated;
GRANT ALL ON public.parts_sales TO service_role;
ALTER TABLE public.parts_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parts_sales_owner_all" ON public.parts_sales;
CREATE POLICY "parts_sales_owner_all" ON public.parts_sales FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS parts_sales_user_idx ON public.parts_sales(user_id, created_at DESC);

-- receipt_settings
CREATE TABLE IF NOT EXISTS public.receipt_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  bg_color TEXT NOT NULL DEFAULT '#ffffff',
  accent_color TEXT NOT NULL DEFAULT '#ec4899',
  text_color TEXT NOT NULL DEFAULT '#0f172a',
  font_family TEXT NOT NULL DEFAULT '"Courier New", Courier, monospace',
  header_text TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT 'Gracias por su compra',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipt_settings TO authenticated;
GRANT ALL ON public.receipt_settings TO service_role;
ALTER TABLE public.receipt_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receipt_settings_owner_all" ON public.receipt_settings;
CREATE POLICY "receipt_settings_owner_all" ON public.receipt_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_receipt_settings_updated_at ON public.receipt_settings;
CREATE TRIGGER update_receipt_settings_updated_at
BEFORE UPDATE ON public.receipt_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
