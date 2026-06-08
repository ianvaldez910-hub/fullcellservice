
-- =========================================================
-- 1) user_roles: bloquear auto-asignación de admin
-- =========================================================
-- Eliminar política permisiva "ALL" sobre public y reemplazar con políticas explícitas
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins select all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2) course_students: scoping por created_by
-- =========================================================
-- Backfill created_by para filas existentes sin owner (asignar al primer admin si existe)
UPDATE public.course_students cs
SET created_by = (
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin' LIMIT 1
)
WHERE cs.created_by IS NULL;

CREATE POLICY "Users view own students"
ON public.course_students
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users insert own students"
ON public.course_students
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users update own students"
ON public.course_students
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users delete own students"
ON public.course_students
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- =========================================================
-- 3) Storage: workshop_logos — prohibir LIST público
-- =========================================================
-- Eliminar la política de lectura pública amplia que permite listar el bucket
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;

-- Permitir lectura solo si se conoce la ruta exacta del archivo (GET por link directo).
-- PostgREST/Storage requiere SELECT para devolver el objeto; lo limitamos al dueño.
-- Para acceso público por link, el front debe usar getPublicUrl que sirve el archivo
-- via el endpoint /object/public sin pasar por SELECT en la tabla, así que mantenemos
-- SELECT restringido al dueño y conservamos el bucket como público para descargas directas.
CREATE POLICY "Owners can read own logos metadata"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'workshop_logos' AND owner = auth.uid());

-- =========================================================
-- 4) SECURITY DEFINER functions: search_path explícito
-- (todas las funciones ya tienen SET search_path = public; reafirmamos por seguridad)
-- =========================================================
ALTER FUNCTION public.track_repair(text) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.auto_assign_admin() SET search_path = public;
ALTER FUNCTION public.renew_license(uuid, integer) SET search_path = public;
ALTER FUNCTION public.activate_plan(uuid, integer) SET search_path = public;
ALTER FUNCTION public.next_order_number(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
