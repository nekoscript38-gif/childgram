CREATE OR REPLACE FUNCTION public.comment_block_reason(_drawing_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_age int;
  author_age int;
BEGIN
  SELECT date_part('year', age(current_date, me.birth_date))::int,
         date_part('year', age(current_date, author.birth_date))::int
    INTO my_age, author_age
  FROM public.drawings d
  JOIN public.profile_private author ON author.user_id = d.user_id
  JOIN public.profile_private me ON me.user_id = auth.uid()
  WHERE d.id = _drawing_id;

  IF NOT FOUND OR my_age IS NULL OR author_age IS NULL THEN RETURN 'unknown'; END IF;
  IF my_age < 9 THEN RETURN 'self_too_young'; END IF;
  IF author_age < 9 THEN RETURN 'author_too_young'; END IF;
  IF (my_age >= 14) <> (author_age >= 14) THEN RETURN 'other_group'; END IF;
  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION public.comment_block_reason(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comment_block_reason(uuid) TO authenticated, service_role;