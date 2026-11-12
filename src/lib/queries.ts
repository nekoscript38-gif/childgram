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
    const { data, error } = await supabase
      .from("profile_private")
      .select("birth_date,parental_consent,terms_accepted_at")
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
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id,username,avatar_id,bio,created_at")
        .ilike("username", escapeLike(username))
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!profile) return null;
      const { data: drawings, error: e2 } = await supabase
        .from("drawings")
        .select(CARD_SELECT)
        .eq("user_id", profile.id)
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (e2) throw new Error(e2.message);
      return { profile, drawings: drawings as unknown as DrawingCard[] };
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
