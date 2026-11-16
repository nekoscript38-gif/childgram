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
  -- Minimum sign-up age: mirrors MIN_SIGNUP_AGE in src/lib/rules.ts.
  IF age(current_date, _birth) < interval '4 years' THEN
    RAISE EXCEPTION 'too_young';
  END IF;
  -- Maximum sign-up age (39 included): mirrors MAX_SIGNUP_AGE in src/lib/rules.ts.
  IF age(current_date, _birth) >= interval '40 years' THEN
    RAISE EXCEPTION 'too_old';
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