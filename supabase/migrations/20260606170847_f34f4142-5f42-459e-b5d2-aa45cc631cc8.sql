
ALTER TABLE public.sales_history ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT 'Consumidor Final';

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['equipment','cash_entries','modules_inventory','general_products','sales_history','course_students']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;
