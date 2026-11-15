-- ChildGram life stages for comments: <9 none, 9-13, 14-17, 18-20, 21+.
-- Same stage can talk; 14-17 <-> 18-20 and 18-20 <-> 21+ can talk; 9-13 only with 9-13; 14-17 never with 21+.
CREATE OR REPLACE FUNCTION public.comment_age_tier(_age integer)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _age IS NULL OR _age < 9 THEN 0
    WHEN _age < 14 THEN 1
    WHEN _age < 18 THEN 2
    WHEN _age < 21 THEN 3
    ELSE 4 END
$$;

CREATE OR REPLACE FUNCTION public.ages_can_comment(_writer integer, _author integer)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT public.comment_age_tier(_writer) > 0
     AND public.comment_age_tier(_author) > 0
     AND (
       public.comment_age_tier(_writer) = public.comment_age_tier(_author)
       OR (
         LEAST(public.comment_age_tier(_writer), public.comment_age_tier(_author)) >= 2
         AND abs(public.comment_age_tier(_writer) - public.comment_age_tier(_author)) = 1
       )
     )
$$;

CREATE OR REPLACE FUNCTION public.can_comment_on(_drawing_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.drawings d
    JOIN public.profile_private author ON author.user_id = d.user_id
    JOIN public.profile_private me ON me.user_id = auth.uid()
    WHERE d.id = _drawing_id
      AND public.ages_can_comment(
        public.effective_age(me.birth_date, me.banned_at),
        public.effective_age(author.birth_date, author.banned_at)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.comment_block_reason(_drawing_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  my_age int;
  author_age int;
  my_ban timestamptz;
  author_ban timestamptz;
BEGIN
  SELECT public.effective_age(me.birth_date, me.banned_at),
         public.effective_age(author.birth_date, author.banned_at),
         me.banned_at, author.banned_at
    INTO my_age, author_age, my_ban, author_ban
  FROM public.drawings d
  JOIN public.profile_private author ON author.user_id = d.user_id
  JOIN public.profile_private me ON me.user_id = auth.uid()
  WHERE d.id = _drawing_id;

  IF NOT FOUND OR my_age IS NULL OR author_age IS NULL THEN RETURN 'unknown'; END IF;
  IF my_ban IS NOT NULL THEN RETURN 'self_banned'; END IF;
  IF author_ban IS NOT NULL THEN RETURN 'author_banned'; END IF;
  IF my_age < 9 THEN RETURN 'self_too_young'; END IF;
  IF author_age < 9 THEN RETURN 'author_too_young'; END IF;
  IF NOT public.ages_can_comment(my_age, author_age) THEN RETURN 'other_group'; END IF;
  RETURN NULL;
END
$$;