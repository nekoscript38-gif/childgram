CREATE OR REPLACE FUNCTION public.profile_private_before_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.birth_date IS NULL OR NEW.birth_date > current_date
     OR NEW.birth_date < current_date - interval '120 years' THEN
    RAISE EXCEPTION 'invalid_birth_date';
  END IF;
  -- Age 0 is reserved for the soft-ban (banned_at), so a real birth date must give at least 1 year.
  IF NEW.birth_date IS DISTINCT FROM OLD.birth_date AND age(current_date, NEW.birth_date) < interval '1 year' THEN
    RAISE EXCEPTION 'age_zero_reserved_for_ban';
  END IF;
  IF NEW.banned_at IS NOT NULL AND OLD.banned_at IS NULL AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_ban_self';
  END IF;
  RETURN NEW;
END;
$$;