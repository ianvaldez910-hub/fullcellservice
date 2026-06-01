ALTER TABLE public.course_students
  ADD COLUMN IF NOT EXISTS monto_abonado numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS curso text NOT NULL DEFAULT '';

ALTER TABLE public.general_products
  ADD COLUMN IF NOT EXISTS warranty_days integer NOT NULL DEFAULT 0;