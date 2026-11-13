import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Lock, Pencil, Send, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KidAvatar } from "@/components/childgram/Avatar";
import { HeartButton } from "@/components/childgram/HeartButton";
import { canCommentQuery, commentsQuery, drawingQuery, meQuery, myHeartsQuery } from "@/lib/queries";
import { COMMENT_MAX } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/dessin/$drawingId")({
  loader: async ({ context, params }) => {
    const [d] = await Promise.all([
      context.queryClient.ensureQueryData(drawingQuery(params.drawingId)),
      context.queryClient.ensureQueryData(commentsQuery(params.drawingId)),
      context.queryClient.ensureQueryData(myHeartsQuery),
      context.queryClient.ensureQueryData(meQuery),
      context.queryClient.ensureQueryData(canCommentQuery(params.drawingId)),
    ]);
    if (!d) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Un dessin sur ChildGram" },
      { name: "description", content: "Regarde ce dessin, envoie un cœur et laisse un mot gentil." },
      { property: "og:title", content: "Un dessin sur ChildGram" },
      { property: "og:description", content: "Regarde ce dessin, envoie un cœur et laisse un mot gentil." },
    ],
  }),
  component: DrawingPage,
  errorComponent: RouteError,
  notFoundComponent: () => (
    <div className="sticker mx-auto max-w-md p-8 text-center">
      <p className="font-display text-2xl font-bold">Ce dessin n'existe pas ou n'est plus publié.</p>
      <Link to="/fil" className="mt-4 inline-block font-bold text-primary underline">Retour au fil</Link>
    </div>
  ),
});

function DrawingPage() {
  const { drawingId } = Route.useParams();
  const { data: drawing } = useSuspenseQuery(drawingQuery(drawingId));
  const { data: comments } = useSuspenseQuery(commentsQuery(drawingId));
  const { data: hearts } = useSuspenseQuery(myHeartsQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: blockReason } = useSuspenseQuery(canCommentQuery(drawingId));
  const canComment = blockReason === null;
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const isOwner = !!me && drawing?.user_id === me.id;

  const addComment = useMutation({
    mutationFn: async () => {
      const content = text.trim();
      if (!content) throw new Error("Écris un petit mot d'abord");
      const { error } = await supabase
        .from("comments")
        .insert({ drawing_id: drawingId, user_id: me!.id, content: content.slice(0, COMMENT_MAX) });
      if (error) {
        if (error.code === "42501") throw new Error("Tu ne peux pas commenter ce dessin à cause de la règle des âges.");
        throw new Error("Impossible d'envoyer ton commentaire");
      }
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", drawingId] });
      qc.invalidateQueries({ queryKey: ["drawing", drawingId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw new Error("Impossible de supprimer ce commentaire");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", drawingId] });
      qc.invalidateQueries({ queryKey: ["drawing", drawingId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!drawing) return null;
  const author = drawing.profiles;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="sticker-lg relative p-3">
          <span className="tape" aria-hidden />
          <img src={drawing.image_data} alt={drawing.title || "Dessin"} width={800} height={800} className="aspect-square w-full rounded-xl border-[2.5px] border-ink bg-paper object-contain" />
        </div>
        {!drawing.is_published && (
          <p className="rounded-2xl border-[2.5px] border-ink bg-secondary p-3 font-bold">
            Ce dessin est un brouillon : toi seul peux le voir.
          </p>
        )}
      </div>

      <div className="space-y-5">
        <div className="sticker space-y-4 p-5">
          <h1 className="text-3xl font-extrabold">{drawing.title || "Sans titre"}</h1>
          {author && (
            <Link to="/profil/$username" params={{ username: author.username }} className="flex items-center gap-3">
              <KidAvatar avatarId={author.avatar_id} size={48} />
              <div>
                <p className="font-display text-lg font-bold leading-tight">@{author.username}</p>
                {drawing.published_at && (
                  <p className="text-sm font-semibold text-muted-foreground">
                    {formatDistanceToNow(new Date(drawing.published_at), { locale: fr, addSuffix: true })}
                  </p>
                )}
              </div>
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <HeartButton
              size="lg"
              drawingId={drawing.id}
              count={drawing.hearts?.[0]?.count ?? 0}
              liked={hearts.includes(drawing.id)}
              disabled={!drawing.is_published}
            />
            {isOwner && (
              <Button asChild variant="outline">
                <Link to="/studio/$drawingId" params={{ drawingId: drawing.id }}>
                  <Pencil /> Modifier
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="sticker space-y-4 p-5">
          <h2 className="text-2xl font-bold">Commentaires ({comments.length})</h2>
          {comments.length === 0 && (
            <p className="font-semibold text-muted-foreground">Pas encore de commentaire. Laisse le premier mot gentil !</p>
          )}
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <KidAvatar avatarId={c.profiles?.avatar_id} size={36} />
                <div className="min-w-0 flex-1 rounded-2xl border-[2.5px] border-ink bg-muted px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    {c.profiles ? (
                      <Link to="/profil/$username" params={{ username: c.profiles.username }} className="truncate font-display font-bold">
                        @{c.profiles.username}
                      </Link>
                    ) : (
                      <span className="font-display font-bold">Artiste</span>
                    )}
                    {(c.user_id === me?.id || isOwner) && (
                      <button
                        type="button"
                        onClick={() => deleteComment.mutate(c.id)}
                        aria-label="Supprimer le commentaire"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words font-semibold">{c.content}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { locale: fr, addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {drawing.is_published && !canComment && (
            <p className="flex items-start gap-2 rounded-2xl border-[2.5px] border-ink bg-secondary p-3 text-sm font-bold">
              <Lock className="h-4 w-4 shrink-0" />
              {blockReason === "self_too_young"
                ? "Les commentaires s'ouvriront pour toi à tes 9 ans. En attendant, tu peux envoyer des cœurs !"
                : blockReason === "author_too_young"
                  ? "Cet artiste a moins de 9 ans : ses dessins ne reçoivent pas de commentaires. Tu peux quand même lui envoyer un cœur !"
                  : "Les commentaires sont réservés aux artistes de la même tranche d'âge (9 à 13 ans, ou 14 ans et plus). Tu peux quand même envoyer un cœur !"}
            </p>
          )}

          {drawing.is_published && canComment && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addComment.mutate();
              }}
              className="space-y-2"
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={COMMENT_MAX}
                placeholder="Écris un mot gentil…"
                aria-label="Ton commentaire"
              />
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-start gap-1.5 text-xs font-bold text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Sois gentil et ne partage jamais d'infos privées (nom, adresse, école…).
                </p>
                <Button type="submit" size="sm" disabled={addComment.isPending || !text.trim()}>
                  <Send /> Envoyer
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
