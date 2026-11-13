CREATE OR REPLACE FUNCTION public.can_comment_on(_drawing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT (date_part('year', age(current_date, me.birth_date)) >= 14)
         = (date_part('year', age(current_date, author.birth_date)) >= 14)
    FROM public.drawings d
    JOIN public.profile_private author ON author.user_id = d.user_id
    JOIN public.profile_private me ON me.user_id = auth.uid()
    WHERE d.id = _drawing_id
  ), false)
$$;

REVOKE ALL ON FUNCTION public.can_comment_on(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_comment_on(uuid) TO authenticated, service_role;

ALTER POLICY "Comment on published drawings" ON public.comments
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.drawings d WHERE d.id = drawing_id AND d.is_published)
    AND public.can_comment_on(drawing_id)
  );