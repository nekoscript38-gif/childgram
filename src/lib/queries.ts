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
      .select(
        "birth_date,parental_consent,terms_accepted_at,banned_at,ban_reason,curfew_strikes,curfew_custom,curfew_morning,curfew_evening,curfew_noon_start,curfew_noon_end",
      )
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
  ban_reason: string | null;
  curfew_strikes: number;
  curfew_last_strike_at: string | null;
  curfew_custom: boolean;
  curfew_morning: string | null;
  curfew_evening: string | null;
  curfew_noon_start: string | null;
  curfew_noon_end: string | null;
};

const ADMIN_PRIVATE_SELECT =
  "user_id,birth_date,parental_consent,banned_at,ban_reason,curfew_strikes,curfew_last_strike_at,curfew_custom,curfew_morning,curfew_evening,curfew_noon_start,curfew_noon_end";

export const adminUsersQuery = queryOptions({
  queryKey: ["admin", "users"],
  queryFn: async () => {
    const [{ data: profiles, error: e1 }, { data: priv, error: e2 }] = await Promise.all([
      supabase.from("profiles").select("id,username,avatar_id,created_at").order("created_at", { ascending: false }),
      supabase.from("profile_private").select(ADMIN_PRIVATE_SELECT),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    const byId = new Map(priv.map((p) => [p.user_id, p]));
    return profiles.map<AdminUserRow>((p) => {
      const pp = byId.get(p.id);
      return {
        ...p,
        birth_date: pp?.birth_date ?? null,
        parental_consent: pp?.parental_consent ?? false,
        banned_at: pp?.banned_at ?? null,
        ban_reason: pp?.ban_reason ?? null,
        curfew_strikes: pp?.curfew_strikes ?? 0,
        curfew_last_strike_at: pp?.curfew_last_strike_at ?? null,
        curfew_custom: pp?.curfew_custom ?? false,
        curfew_morning: pp?.curfew_morning ?? null,
        curfew_evening: pp?.curfew_evening ?? null,
        curfew_noon_start: pp?.curfew_noon_start ?? null,
        curfew_noon_end: pp?.curfew_noon_end ?? null,
      };
    });
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

/** Age barrier by life stage (see canCommentBetween); enforced by the comments RLS policy. */
export const canCommentQuery = (drawingId: string) =>
  queryOptions({
    queryKey: ["can-comment", drawingId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("comment_block_reason", { _drawing_id: drawingId });
      if (error) throw new Error(error.message);
      return (data ?? null) as CommentBlockReason;
    },
  });


export type BanMessage = { id: string; user_id: string; sender_id: string; content: string; created_at: string };

/** One banned profile's private conversation with the admin (RLS: that user while banned, or admins). */
export const banMessagesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["ban-messages", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ban_messages")
        .select("id,user_id,sender_id,content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data as BanMessage[];
    },
    refetchInterval: 10_000,
  });

/** Admin overview: last message per conversation (who wrote last, and when). */
export const adminBanInboxQuery = queryOptions({
  queryKey: ["ban-messages", "admin-inbox"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("ban_messages")
      .select("user_id,sender_id,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    const last = new Map<string, { sender_id: string; created_at: string; count: number }>();
    for (const m of data) {
      const cur = last.get(m.user_id);
      if (cur) cur.count += 1;
      else last.set(m.user_id, { sender_id: m.sender_id, created_at: m.created_at, count: 1 });
    }
    return Object.fromEntries(last);
  },
  refetchInterval: 30_000,
});
