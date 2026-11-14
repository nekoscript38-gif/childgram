import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProfileLite = { id: string; username: string; avatar_id: number };

export type DrawingCard = {
  id: string;
  title: string;
  image_data: string;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
  user_id: string;
  profiles: ProfileLite | null;
  hearts: { count: number }[];
  comments: { count: number }[];
};

const CARD_SELECT =
  "id,title,image_data,is_published,published_at,updated_at,user_id,profiles!drawings_user_id_fkey(id,username,avatar_id),hearts(count),comments(count)";

function escapeLike(v: string) {
  return v.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  },
  staleTime: Infinity,
});

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,avatar_id,bio,created_at")
      .eq("id", u.user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
});

export const myPrivateQuery = queryOptions({
  queryKey: ["me", "private"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    // Always filter by the caller: admins can read every row, so an unfiltered
    // maybeSingle() would fail with "multiple rows" for them.
    const { data, error } = await supabase
      .from("profile_private")
      .select("birth_date,parental_consent,terms_accepted_at,banned_at")
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
});

export const feedQuery = queryOptions({
  queryKey: ["feed"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("drawings")
      .select(CARD_SELECT)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data as unknown as DrawingCard[];
  },
});

export const myHeartsQuery = queryOptions({
  queryKey: ["my-hearts"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [] as string[];
    const { data, error } = await supabase
      .from("hearts")
      .select("drawing_id")
      .eq("user_id", u.user.id);
    if (error) throw new Error(error.message);
    return data.map((h) => h.drawing_id);
  },
});

export const myDrawingsQuery = queryOptions({
  queryKey: ["my-drawings"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [] as DrawingCard[];
    const { data, error } = await supabase
      .from("drawings")
      .select(CARD_SELECT)
      .eq("user_id", u.user.id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as unknown as DrawingCard[];
  },
});

export const profileQuery = (username: string) =>
  queryOptions({
    queryKey: ["profile", username.toLowerCase()],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("profiles")
        .select("id,username,avatar_id,bio,created_at,current_age")
        .ilike("username", escapeLike(username))
        .maybeSingle();
      if (error) throw new Error(error.message);
      const profile = row as unknown as PublicProfile | null;
      if (!profile) return null;
      const { data: drawings, error: e2 } = await supabase
        .from("drawings")
        .select(CARD_SELECT)
        .eq("user_id", profile.id)
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (e2) throw new Error(e2.message);
      return {
        profile,
        drawings: drawings as unknown as DrawingCard[],
      };
    },
  });

export type PublicProfile = {
  id: string;
  username: string;
  avatar_id: number;
  bio: string;
  created_at: string;
  /** Current age in years (number only, never the birth date). */
  current_age: number | null;
};

export const isAdminQuery = queryOptions({
  queryKey: ["me", "is-admin"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return false;
    const { data, error } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (error) return false;
    return data === true;
  },
  staleTime: 5 * 60_000,
});

export type AdminUserRow = {
  id: string;
  username: string;
  avatar_id: number;
  created_at: string;
  birth_date: string | null;
  parental_consent: boolean;
  banned_at: string | null;
};

export const adminUsersQuery = queryOptions({
  queryKey: ["admin", "users"],
  queryFn: async () => {
    const [{ data: profiles, error: e1 }, { data: priv, error: e2 }] = await Promise.all([
      supabase.from("profiles").select("id,username,avatar_id,created_at").order("created_at", { ascending: false }),
      supabase.from("profile_private").select("user_id,birth_date,parental_consent,banned_at"),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    const byId = new Map(priv.map((p) => [p.user_id, p]));
    return profiles.map<AdminUserRow>((p) => ({
      ...p,
      birth_date: byId.get(p.id)?.birth_date ?? null,
      parental_consent: byId.get(p.id)?.parental_consent ?? false,
      banned_at: byId.get(p.id)?.banned_at ?? null,
    }));
  },
});

export type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: ProfileLite | null;
};

export const drawingQuery = (id: string) =>
  queryOptions({
    queryKey: ["drawing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drawings")
        .select(CARD_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as DrawingCard) ?? null;
    },
  });

export const commentsQuery = (drawingId: string) =>
  queryOptions({
    queryKey: ["comments", drawingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id,content,created_at,user_id,profiles(id,username,avatar_id)")
        .eq("drawing_id", drawingId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data as unknown as CommentRow[];
    },
  });

export const editableDrawingQuery = (id: string) =>
  queryOptions({
    queryKey: ["edit-drawing", id],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("drawings")
        .select("id,title,image_data,is_published,user_id")
        .eq("id", id)
        .eq("user_id", u.user?.id ?? "")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

/** Why a comment is blocked (null when allowed). Real enforcement is the comments RLS policy. */
export type CommentBlockReason =
  | "self_banned"
  | "author_banned"
  | "self_too_young"
  | "author_too_young"
  | "other_group"
  | "unknown"
  | null;

/** Age barrier: under-9 kids get no comments; 9-13 and 14+ can't comment on each other (enforced by RLS). */
export const canCommentQuery = (drawingId: string) =>
  queryOptions({
    queryKey: ["can-comment", drawingId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("comment_block_reason", { _drawing_id: drawingId });
      if (error) throw new Error(error.message);
      return (data ?? null) as CommentBlockReason;
    },
  });

/** True when the signed-in kid is soft-banned (age set to 0 by the admin). Enforced by RLS. */
export const amIBannedQuery = queryOptions({
  ...myPrivateQuery,
  select: (p: Awaited<ReturnType<NonNullable<typeof myPrivateQuery.queryFn>>>) => !!p?.banned_at,
});
