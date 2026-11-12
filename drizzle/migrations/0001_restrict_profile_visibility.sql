DROP POLICY IF EXISTS "Signed-in users can view profiles" ON public.profiles;

CREATE INDEX IF NOT EXISTS comments_user_idx ON public.comments (user_id);

CREATE POLICY "View own or active artists profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.drawings d
      WHERE d.user_id = profiles.id AND d.is_published
    )
    OR EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.drawings d ON d.id = c.drawing_id
      WHERE c.user_id = profiles.id AND d.is_published
    )
  );