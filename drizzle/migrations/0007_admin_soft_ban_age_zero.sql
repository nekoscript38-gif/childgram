ALTER TABLE public.profile_private ADD COLUMN banned_at timestamptz;
GRANT UPDATE (banned_at) ON public.profile_private TO authenticated; -- only admins pass the UPDATE policy

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profile_private WHERE user_id = _user_id AND banned_at IS NOT NULL)
$$;
REVOKE EXECUTE ON FUNCTION public.is_banned(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO authenticated, service_role;

-- Age used by every rule: 0 while banned (frozen), else the real age.
CREATE OR REPLACE FUNCTION public.effective_age(_birth date, _banned_at timestamptz)
RETURNS integer LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE WHEN _banned_at IS NOT NULL THEN 0
              ELSE date_part('year', age(current_date, _birth))::integer END
$$;

CREATE OR REPLACE FUNCTION public.current_age(p public.profiles)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.effective_age(pp.birth_date, pp.banned_at)
  FROM public.profile_private pp
  WHERE pp.user_id = p.id
    AND (
      auth.uid() = p.id
      OR public.has_role(auth.uid(), 'admin')
      OR pp.banned_at IS NOT NULL
      OR EXISTS (SELECT 1 FROM public.drawings d WHERE d.user_id = p.id AND d.is_published)
      OR EXISTS (
        SELECT 1 FROM public.comments c JOIN public.drawings d ON d.id = c.drawing_id
        WHERE c.user_id = p.id AND d.is_published
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
      AND public.effective_age(me.birth_date, me.banned_at) >= 9
      AND public.effective_age(author.birth_date, author.banned_at) >= 9
      AND (public.effective_age(me.birth_date, me.banned_at) >= 14)
        = (public.effective_age(author.birth_date, author.banned_at) >= 14)
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
  IF (my_age >= 14) <> (author_age >= 14) THEN RETURN 'other_group'; END IF;
  RETURN NULL;
END
$$;

-- Drawings: banned users can't create or modify; their drawings are hidden from other kids.
ALTER POLICY "View published or own drawings" ON public.drawings
  USING (
    auth.uid() = user_id
    OR (is_published AND (NOT public.is_banned(user_id) OR public.has_role(auth.uid(), 'admin')))
  );
ALTER POLICY "Create own drawings" ON public.drawings
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
ALTER POLICY "Update own drawings" ON public.drawings
  USING (auth.uid() = user_id AND NOT public.is_banned(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

-- Profiles: banned users can't edit theirs; banned profiles are visible so they can show "profil banni".
ALTER POLICY "Users update own profile" ON public.profiles
  USING (auth.uid() = id AND NOT public.is_banned(auth.uid()))
  WITH CHECK (auth.uid() = id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "View banned profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_banned(id));

-- Hearts: banned users can't give hearts and can't receive new ones.
ALTER POLICY "Give hearts on published drawings" ON public.hearts
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.is_banned(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.drawings d
      WHERE d.id = drawing_id AND d.is_published AND NOT public.is_banned(d.user_id)
    )
  );