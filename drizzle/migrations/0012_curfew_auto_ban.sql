ALTER TABLE public.profile_private
  ADD COLUMN curfew_strikes smallint NOT NULL DEFAULT 0,
  ADD COLUMN curfew_last_strike_at timestamptz,
  ADD COLUMN ban_reason text,
  ADD COLUMN curfew_custom boolean NOT NULL DEFAULT false,
  ADD COLUMN curfew_morning time,
  ADD COLUMN curfew_evening time,
  ADD COLUMN curfew_noon_start time,
  ADD COLUMN curfew_noon_end time;

COMMENT ON COLUMN public.profile_private.ban_reason IS 'NULL = banned by the admin; ''curfew'' = automatic ban after 2 curfew strikes.';
COMMENT ON COLUMN public.profile_private.curfew_custom IS 'When true, the curfew_* times replace the age-based defaults (all NULL = no curfew).';

-- Only admins pass the profile_private UPDATE policy.
GRANT UPDATE (curfew_custom, curfew_morning, curfew_evening, curfew_noon_start, curfew_noon_end, curfew_strikes)
  ON public.profile_private TO authenticated;

-- Pure rule, mirrored by isInCurfew() in src/lib/rules.ts. _at is the local (Paris) time.
CREATE OR REPLACE FUNCTION public.curfew_blocked_at(
  _age integer, _custom boolean, _morning time, _evening time, _noon_start time, _noon_end time, _at timestamp
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  m time; e time; ns time; ne time;
  t time := _at::time;
  dow integer := extract(isodow FROM _at);
BEGIN
  IF _custom THEN
    m := _morning; e := _evening; ns := _noon_start; ne := _noon_end;
  ELSIF _age IS NULL OR _age < 1 OR _age >= 18 THEN
    RETURN false;
  ELSIF _age < 9 THEN
    m := '08:00'; e := '20:00'; ns := '14:00'; ne := '16:00';
  ELSIF _age < 14 THEN
    m := '07:00'; e := '21:00'; ns := '14:00'; ne := '17:00';
  ELSE
    m := '06:00'; e := '22:00'; ns := '15:00'; ne := '18:00';
  END IF;
  IF m IS NOT NULL AND t < m THEN RETURN true; END IF;
  IF e IS NOT NULL AND t >= e THEN RETURN true; END IF;
  -- Afternoon curfew only on school days (not Wednesday, Saturday, Sunday).
  IF ns IS NOT NULL AND ne IS NOT NULL AND dow NOT IN (3, 6, 7) AND t >= ns AND t < ne THEN RETURN true; END IF;
  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.curfew_blocked_at(integer, boolean, time, time, time, time, timestamp) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.profile_private_before_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _auto boolean := coalesce(current_setting('childgram.curfew_ban', true), '') = 'on';
BEGIN
  IF NEW.birth_date IS NULL OR NEW.birth_date > current_date
     OR NEW.birth_date < current_date - interval '120 years' THEN
    RAISE EXCEPTION 'invalid_birth_date';
  END IF;
  -- Age 0 is reserved for the soft-ban (banned_at), so a real birth date must give at least 1 year.
  IF NEW.birth_date IS DISTINCT FROM OLD.birth_date AND age(current_date, NEW.birth_date) < interval '1 year' THEN
    RAISE EXCEPTION 'age_zero_reserved_for_ban';
  END IF;
  IF NEW.banned_at IS NOT NULL AND OLD.banned_at IS NULL AND NEW.user_id = auth.uid() AND NOT _auto THEN
    RAISE EXCEPTION 'cannot_ban_self';
  END IF;
  IF NEW.banned_at IS NOT NULL AND OLD.banned_at IS NULL AND NOT _auto THEN
    NEW.ban_reason := NULL; -- manual ban by the admin
  END IF;
  IF NEW.banned_at IS NULL AND OLD.banned_at IS NOT NULL THEN
    -- Reactivation clears the curfew counter.
    NEW.ban_reason := NULL;
    NEW.curfew_strikes := 0;
    NEW.curfew_last_strike_at := NULL;
  END IF;
  IF NEW.curfew_strikes < 0 THEN NEW.curfew_strikes := 0; END IF;
  IF (NEW.curfew_noon_start IS NULL) <> (NEW.curfew_noon_end IS NULL)
     OR (NEW.curfew_noon_start IS NOT NULL AND NEW.curfew_noon_start >= NEW.curfew_noon_end) THEN
    RAISE EXCEPTION 'invalid_curfew_noon';
  END IF;
  IF NEW.curfew_morning IS NOT NULL AND NEW.curfew_evening IS NOT NULL AND NEW.curfew_morning >= NEW.curfew_evening THEN
    RAISE EXCEPTION 'invalid_curfew_day';
  END IF;
  RETURN NEW;
END;
$$;

-- Called by the app when a signed-in user opens ChildGram. Returns 'ok', 'warning' or 'banned'.
CREATE OR REPLACE FUNCTION public.check_curfew()
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  pp public.profile_private%ROWTYPE;
  _strikes integer;
  _admin uuid;
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin'::public.app_role) THEN
    RETURN 'ok';
  END IF;
  SELECT * INTO pp FROM public.profile_private WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND OR pp.banned_at IS NOT NULL THEN
    RETURN 'ok';
  END IF;
  IF NOT public.curfew_blocked_at(
    public.effective_age(pp.birth_date, NULL), pp.curfew_custom, pp.curfew_morning, pp.curfew_evening,
    pp.curfew_noon_start, pp.curfew_noon_end, (now() AT TIME ZONE 'Europe/Paris')
  ) THEN
    RETURN 'ok';
  END IF;
  -- At most one suspicious connection counted per hour (reloads don't count twice).
  IF pp.curfew_last_strike_at IS NOT NULL AND pp.curfew_last_strike_at > now() - interval '1 hour' THEN
    RETURN 'warning';
  END IF;
  _strikes := pp.curfew_strikes + 1;
  IF _strikes >= 2 THEN
    PERFORM set_config('childgram.curfew_ban', 'on', true);
    UPDATE public.profile_private
      SET banned_at = now(), ban_reason = 'curfew', curfew_strikes = _strikes, curfew_last_strike_at = now()
      WHERE user_id = _uid;
    PERFORM set_config('childgram.curfew_ban', '', true);
    SELECT ur.user_id INTO _admin FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.role = 'admin'::public.app_role LIMIT 1;
    IF _admin IS NOT NULL THEN
      INSERT INTO public.ban_messages (user_id, sender_id, content) VALUES (
        _uid, _admin,
        'Message automatique : ton compte a été temporairement désactivé pour activité de connexion à des horaires suspects pour l''âge déclaré. Si c''est une erreur, réponds ici : l''administratrice peut réactiver ton compte.'
      );
    END IF;
    RETURN 'banned';
  END IF;
  UPDATE public.profile_private SET curfew_strikes = _strikes, curfew_last_strike_at = now() WHERE user_id = _uid;
  RETURN 'warning';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_curfew() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_curfew() TO authenticated, service_role;