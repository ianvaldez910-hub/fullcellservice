CREATE TABLE public.course_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  apellido text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  estado_pago text NOT NULL DEFAULT 'señado',
  fecha_registro timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all students"
ON public.course_students FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert students"
ON public.course_students FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update students"
ON public.course_students FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete students"
ON public.course_students FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_course_students_updated_at
BEFORE UPDATE ON public.course_students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();