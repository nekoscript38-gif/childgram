-- PROFILES (public info visible to signed-in kids)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_id smallint NOT NULL DEFAULT 1 CHECK (avatar_id BETWEEN 1 AND 20),
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (avatar_id, bio) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PRIVATE PROFILE DATA (birth date, consent) - only the owner can read
CREATE TABLE public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  birth_date date NOT NULL,
  parental_consent boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own private data" ON public.profile_private
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- DRAWINGS
CREATE TABLE public.drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 60),
  image_data text NOT NULL CHECK (char_length(image_data) < 3000000 AND image_data LIKE 'data:image/%'),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX drawings_user_idx ON public.drawings (user_id, updated_at DESC);
CREATE INDEX drawings_published_idx ON public.drawings (published_at DESC) WHERE is_published;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drawings TO authenticated;
GRANT ALL ON public.drawings TO service_role;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View published or own drawings" ON public.drawings
  FOR SELECT TO authenticated USING (is_published OR auth.uid() = user_id);
CREATE POLICY "Create own drawings" ON public.drawings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own drawings" ON public.drawings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own drawings" ON public.drawings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.drawings_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.is_published AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  IF NOT NEW.is_published THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER drawings_before_write BEFORE INSERT OR UPDATE ON public.drawings
  FOR EACH ROW EXECUTE FUNCTION public.drawings_before_write();

-- HEARTS
CREATE TABLE public.hearts (
  drawing_id uuid NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (drawing_id, user_id)
);
CREATE INDEX hearts_user_idx ON public.hearts (user_id);
GRANT SELECT, INSERT, DELETE ON public.hearts TO authenticated;
GRANT ALL ON public.hearts TO service_role;
ALTER TABLE public.hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View hearts on visible drawings" ON public.hearts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.drawings d WHERE d.id = drawing_id)
  );
CREATE POLICY "Give hearts on published drawings" ON public.hearts
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.drawings d WHERE d.id = drawing_id AND d.is_published)
  );
CREATE POLICY "Remove own hearts" ON public.hearts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id uuid NOT NULL REFERENCES public.drawings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_drawing_idx ON public.comments (drawing_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments on visible drawings" ON public.comments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.drawings d WHERE d.id = drawing_id)
  );
CREATE POLICY "Comment on published drawings" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.drawings d WHERE d.id = drawing_id AND d.is_published)
  );
CREATE POLICY "Delete own comments or comments on own drawings" ON public.comments
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.drawings d WHERE d.id = drawing_id AND d.user_id = auth.uid())
  );

-- SIGNUP: create profile + private data, enforce parental consent under 13
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _username text := NEW.raw_user_meta_data ->> 'username';
  _avatar smallint := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'avatar_id', '')::smallint, 1);
  _bio text := COALESCE(NEW.raw_user_meta_data ->> 'bio', '');
  _birth date := NULLIF(NEW.raw_user_meta_data ->> 'birth_date', '')::date;
  _consent boolean := COALESCE((NEW.raw_user_meta_data ->> 'parental_consent')::boolean, false);
  _terms boolean := COALESCE((NEW.raw_user_meta_data ->> 'terms_accepted')::boolean, false);
BEGIN
  IF _username IS NULL THEN
    RAISE EXCEPTION 'username_required';
  END IF;
  IF _birth IS NULL OR _birth > current_date OR _birth < current_date - interval '120 years' THEN
    RAISE EXCEPTION 'invalid_birth_date';
  END IF;
  IF NOT _terms THEN
    RAISE EXCEPTION 'terms_not_accepted';
  END IF;
  IF age(current_date, _birth) < interval '13 years' AND NOT _consent THEN
    RAISE EXCEPTION 'parental_consent_required';
  END IF;

  INSERT INTO public.profiles (id, username, avatar_id, bio)
  VALUES (NEW.id, _username, _avatar, left(_bio, 200));

  INSERT INTO public.profile_private (user_id, birth_date, parental_consent)
  VALUES (NEW.id, _birth, _consent);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_profile()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_profile();