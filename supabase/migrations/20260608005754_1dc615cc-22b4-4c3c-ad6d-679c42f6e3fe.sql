
-- Public tracking RPC: returns only safe fields, matched by order number or phone
CREATE OR REPLACE FUNCTION public.track_repair(_query text)
RETURNS TABLE (
  order_number integer,
  brand text,
  model text,
  problem text,
  budget numeric,
  date_in date,
  date_estimated date,
  status equipment_status,
  business_name text,
  whatsapp_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.order_number, e.brand, e.model, e.problem, e.budget,
         e.date_in, e.date_estimated, e.status,
         COALESCE(p.business_name, 'FullCell Service') AS business_name,
         COALESCE(p.whatsapp_number, '') AS whatsapp_number
  FROM public.equipment e
  LEFT JOIN public.profiles p ON p.user_id = e.user_id
  WHERE
    (
      -- exact order number match
      (_query ~ '^[0-9]+$' AND e.order_number = _query::int)
      OR
      -- phone match (digits only)
      (
        length(regexp_replace(_query, '\D', '', 'g')) >= 6
        AND (
          regexp_replace(COALESCE(e.phone, ''), '\D', '', 'g') = regexp_replace(_query, '\D', '', 'g')
          OR regexp_replace(COALESCE(e.alt_phone, ''), '\D', '', 'g') = regexp_replace(_query, '\D', '', 'g')
        )
      )
    )
  ORDER BY e.created_at DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.track_repair(text) TO anon, authenticated;
