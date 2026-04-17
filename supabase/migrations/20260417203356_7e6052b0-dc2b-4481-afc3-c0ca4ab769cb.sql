
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_activo text,
  ADD COLUMN IF NOT EXISTS fecha_inicio_plan timestamptz,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento_plan timestamptz;

CREATE OR REPLACE FUNCTION public.activate_plan(_user_id uuid, _months integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can activate plans';
  END IF;

  _now := now() AT TIME ZONE 'America/Argentina/Buenos_Aires';

  UPDATE public.profiles
  SET plan_activo = _months || ' meses',
      fecha_inicio_plan = _now,
      fecha_vencimiento_plan = _now + (_months || ' months')::interval,
      license_status = 'active',
      trial_ends_at = _now + (_months || ' months')::interval
  WHERE user_id = _user_id;
END;
$$;
