CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Admin can see every profile and every birth date
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read all private data" ON public.profile_private
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can correct a birth date (only that column)
GRANT UPDATE (birth_date) ON public.profile_private TO authenticated;
CREATE POLICY "Admins correct birth dates" ON public.profile_private
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.profile_private_before_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.birth_date IS NULL OR NEW.birth_date > current_date
     OR NEW.birth_date < current_date - interval '120 years' THEN
    RAISE EXCEPTION 'invalid_birth_date';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profile_private_before_update BEFORE UPDATE ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.profile_private_before_update();

-- Public age (number only) as a computed field on profiles.
-- Returns NULL unless the caller may see that profile.
CREATE OR REPLACE FUNCTION public.current_age(p public.profiles)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_part('year', age(current_date, pp.birth_date))::integer
  FROM public.profile_private pp
  WHERE pp.user_id = p.id
    AND (
      auth.uid() = p.id
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.drawings d WHERE d.user_id = p.id AND d.is_published)
      OR EXISTS (
        SELECT 1 FROM public.comments c JOIN public.drawings d ON d.id = c.drawing_id
        WHERE c.user_id = p.id AND d.is_published
      )
    )
$$;
REVOKE EXECUTE ON FUNCTION public.current_age(public.profiles) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_age(public.profiles) TO authenticated, service_role;