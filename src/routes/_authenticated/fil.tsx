import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DrawingCard } from "@/components/childgram/DrawingCard";
import { Button } from "@/components/ui/button";
import { feedQuery, meQuery, myHeartsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/fil")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(feedQuery),
      context.queryClient.ensureQueryData(myHeartsQuery),
      context.queryClient.ensureQueryData(meQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Le fil des dessins — ChildGram" },
      { name: "description", content: "Découvre les derniers dessins publiés par les enfants de ChildGram." },
      { property: "og:title", content: "Le fil des dessins — ChildGram" },
      { property: "og:description", content: "Découvre les derniers dessins publiés par les enfants de ChildGram." },
    ],
  }),
  component: Feed,
  errorComponent: ({ error }) => <p className="sticker p-6 font-bold">Erreur : {error.message}</p>,
  notFoundComponent: () => <p className="sticker p-6 font-bold">Rien ici.</p>,
});

function Feed() {
  const { data: drawings } = useSuspenseQuery(feedQuery);
  const { data: hearts } = useSuspenseQuery(myHeartsQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  const liked = new Set(hearts);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-lg font-bold text-muted-foreground">Coucou {me?.username} 👋</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Le fil des dessins</h1>
        </div>
        <Button asChild>
          <Link to="/studio/$drawingId" params={{ drawingId: "nouveau" }}>
            <Plus /> Nouveau dessin
          </Link>
        </Button>
      </div>

      {drawings.length === 0 ? (
        <div className="sticker-lg mx-auto max-w-lg p-10 text-center">
          <p className="text-5xl">🖍️</p>
          <h2 className="mt-3 text-2xl font-bold">Aucun dessin pour l'instant</h2>
          <p className="mt-2 font-semibold text-muted-foreground">Sois le premier à publier une œuvre !</p>
          <Button asChild className="mt-5">
            <Link to="/studio/$drawingId" params={{ drawingId: "nouveau" }}>Je dessine</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.map((d, i) => (
            <DrawingCard key={d.id} drawing={d} liked={liked.has(d.id)} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
