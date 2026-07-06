
CREATE TABLE public.course_editions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_editions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_editions TO authenticated;
GRANT ALL ON public.course_editions TO service_role;

ALTER TABLE public.course_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view editions"
  ON public.course_editions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert editions"
  ON public.course_editions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update editions"
  ON public.course_editions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete editions"
  ON public.course_editions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed with defaults if not present
INSERT INTO public.course_editions (name)
VALUES ('Edición 1'), ('Edición 2'), ('Edición 3'), ('Edición 4')
ON CONFLICT (name) DO NOTHING;
