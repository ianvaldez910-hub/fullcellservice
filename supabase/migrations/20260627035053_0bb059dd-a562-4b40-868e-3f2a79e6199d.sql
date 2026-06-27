
-- 1) Course students: edition + 4 class tracking
ALTER TABLE public.course_students
  ADD COLUMN IF NOT EXISTS edition text,
  ADD COLUMN IF NOT EXISTS clase_1 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clase_2 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clase_3 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clase_4 boolean NOT NULL DEFAULT false;

-- 2) Spare parts categories (admin only)
CREATE TABLE IF NOT EXISTS public.spare_part_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spare_part_categories TO authenticated;
GRANT ALL ON public.spare_part_categories TO service_role;

ALTER TABLE public.spare_part_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage spare part categories"
  ON public.spare_part_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Spare parts (admin only)
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  brand text,
  part_type text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spare_parts TO authenticated;
GRANT ALL ON public.spare_parts TO service_role;

ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage spare parts"
  ON public.spare_parts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
