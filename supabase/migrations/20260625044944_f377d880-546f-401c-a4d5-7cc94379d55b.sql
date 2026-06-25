
-- Tighten EXECUTE on SECURITY DEFINER functions: only track_repair is intentionally public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.renew_license(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_plan(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_order_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.renew_license(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_plan(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_order_number(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- track_repair remains executable by anon (public tracking portal)
GRANT EXECUTE ON FUNCTION public.track_repair(text) TO anon, authenticated, service_role;
