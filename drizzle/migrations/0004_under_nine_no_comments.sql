-- Why a comment is not allowed: NULL when allowed, else 'self_too_young', 'author_too_young' or 'other_group'.
CREATE OR REPLACE FUNCTION public.comment_block_reason(_drawing_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN date_part('year', age(current_date, me.birth_date)) < 9 THEN 'self_too_young'
      WHEN date_part('year', age(current_date, author.birth_date)) < 9 THEN 'author_too_young'
      WHEN (date_part('year', age(current_date, me.birth_date)) >= 14)
         <> (date_part('year', age(current_date, author.birth_date)) >= 14) THEN 'other_group'
      ELSE NULL
    END
    FROM public.drawings d
    JOIN public.profile_private author ON author.user_id = d.user_id
    JOIN public.profile_private me ON me.user_id = auth.uid()
    WHERE d.id = _drawing_id
  ), 'unknown')
  -- COALESCE only applies when no row matched (unknown drawing or missing birth date)
$$;

REVOKE ALL ON FUNCTION public.comment_block_reason(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comment_block_reason(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_comment_on(_drawing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.drawings d
    JOIN public.profile_private author ON author.user_id = d.user_id
    JOIN public.profile_private me ON me.user_id = auth.uid()
    WHERE d.id = _drawing_id
      AND date_part('year', age(current_date, me.birth_date)) >= 9
      AND date_part('year', age(current_date, author.birth_date)) >= 9
      AND (date_part('year', age(current_date, me.birth_date)) >= 14)
        = (date_part('year', age(current_date, author.birth_date)) >= 14)
  )
$$;

REVOKE ALL ON FUNCTION public.can_comment_on(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_comment_on(uuid) TO authenticated, service_role;