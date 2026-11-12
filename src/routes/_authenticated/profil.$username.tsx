import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Images, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KidAvatar } from "@/components/childgram/Avatar";
import { DrawingCard } from "@/components/childgram/DrawingCard";
import { meQuery, myHeartsQuery, profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profil/$username")({
  loader: async ({ context, params }) => {
    const [p] = await Promise.all([
      context.queryClient.ensureQueryData(profileQuery(params.username)),
      context.queryClient.ensureQueryData(myHeartsQuery),
      context.queryClient.ensureQueryData(meQuery),
    ]);
    if (!p) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — ChildGram` },
      { name: "description", content: `Les dessins de @${params.username} sur ChildGram.` },
      { property: "og:title", content: `@${params.username} — ChildGram` },
      { property: "og:description", content: `Les dessins de @${params.username} sur ChildGram.` },
    ],
  }),
  component: ProfilePage,
  errorComponent: RouteError,
  notFoundComponent: () => (
    <div className="sticker mx-auto max-w-md p-8 text-center">
      <p className="font-display text-2xl font-bold">Cet artiste est introuvable.</p>
      <Link to="/fil" className="mt-4 inline-block font-bold text-primary underline">Retour au fil</Link>
    </div>
  ),
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery(username));
  const { data: hearts } = useSuspenseQuery(myHeartsQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  if (!data) return null;
  const { profile, drawings } = data;
  const liked = new Set(hearts);
  const totalHearts = drawings.reduce((s, d) => s + (d.hearts?.[0]?.count ?? 0), 0);
  const isMe = me?.id === profile.id;

  return (
    <div className="space-y-10">
      <section className="sticker-lg flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
        <KidAvatar avatarId={profile.avatar_id} size={128} className="border-[3px] shadow-sticker" />
        <div className="flex-1 space-y-2">
          <h1 className="text-4xl font-extrabold">@{profile.username}</h1>
          {profile.bio ? (
            <p className="max-w-xl whitespace-pre-wrap font-semibold text-muted-foreground">{profile.bio}</p>
          ) : (
            <p className="font-semibold text-muted-foreground">Pas encore de bio.</p>
          )}
          <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
            <span className="flex items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-secondary px-3 py-1 font-display font-bold">
              <Images className="h-4 w-4" /> {drawings.length} dessin{drawings.length > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border-[2.5px] border-ink bg-heart px-3 py-1 font-display font-bold text-heart-foreground">
              <Heart className="h-4 w-4" fill="currentColor" /> {totalHearts} cœur{totalHearts > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {isMe && (
          <Button asChild variant="outline">
            <Link to="/parametres">
              <Pencil /> Modifier mon profil
            </Link>
          </Button>
        )}
      </section>

      {drawings.length === 0 ? (
        <div className="sticker mx-auto max-w-md p-8 text-center">
          <p className="text-4xl">🖼️</p>
          <p className="mt-2 font-display text-xl font-bold">
            {isMe ? "Tu n'as encore rien publié." : "Aucun dessin publié pour l'instant."}
          </p>
          {isMe && (
            <Button asChild className="mt-4">
              <Link to="/studio/$drawingId" params={{ drawingId: "nouveau" }}>Je dessine</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.map((d, i) => (
            <DrawingCard key={d.id} drawing={d} liked={liked.has(d.id)} index={i} showAuthor={false} />
          ))}
        </div>
      )}
    </div>
  );
}
