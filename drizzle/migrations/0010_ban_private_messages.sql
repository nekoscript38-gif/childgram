CREATE TABLE public.ban_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ban_messages IS 'Private conversation between the admin and one banned user (user_id). Open to the user only while banned.';
CREATE INDEX ban_messages_user_created_idx ON public.ban_messages (user_id, created_at);

GRANT SELECT ON public.ban_messages TO authenticated;
GRANT INSERT (user_id, sender_id, content) ON public.ban_messages TO authenticated;
GRANT ALL ON public.ban_messages TO service_role;

ALTER TABLE public.ban_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banned user reads own ban conversation" ON public.ban_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_banned(user_id));

CREATE POLICY "Admins read ban conversations" ON public.ban_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Banned user writes to admin" ON public.ban_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND user_id = auth.uid() AND public.is_banned(auth.uid()));

CREATE POLICY "Admins write to banned users" ON public.ban_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
    AND user_id <> auth.uid()
    AND public.is_banned(user_id)
  );