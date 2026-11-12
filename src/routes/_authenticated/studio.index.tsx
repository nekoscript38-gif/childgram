import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Pencil, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { myDrawingsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/studio/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(myDrawingsQuery),
  head: () => ({
    meta: [
      { title: "Mon studio — ChildGram" },
      { name: "description", content: "Retrouve tes brouillons et tes dessins publiés." },
      { property: "og:title", content: "Mon studio — ChildGram" },
      { property: "og:description", content: "Retrouve tes brouillons et tes dessins publiés." },
    ],
  }),
  component: StudioList,
  errorComponent: RouteError,
  notFoundComponent: () => <p className="sticker p-6 font-bold">Rien ici.</p>,
});

function StudioList() {
  const { data: drawings } = useSuspenseQuery(myDrawingsQuery);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Mon studio</h1>
          <p className="mt-1 font-semibold text-muted-foreground">Tes brouillons et tes dessins publiés.</p>
        </div>
        <Button asChild size="lg">
          <Link to="/studio/$drawingId" params={{ drawingId: "nouveau" }}>
            <Plus /> Nouveau dessin
          </Link>
        </Button>
      </div>

      {drawings.length === 0 ? (
        <div className="sticker-lg mx-auto max-w-lg p-10 text-center">
          <p className="text-5xl">🎨</p>
          <h2 className="mt-3 text-2xl font-bold">Ton studio est tout neuf</h2>
          <p className="mt-2 font-semibold text-muted-foreground">Commence ton premier chef-d'œuvre !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {drawings.map((d) => (
            <Link
              key={d.id}
              to="/studio/$drawingId"
              params={{ drawingId: d.id }}
              className="sticker group flex flex-col gap-2 p-2 transition-transform hover:-translate-y-1"
            >
              <div className="relative overflow-hidden rounded-xl border-[2.5px] border-ink bg-paper">
                <img src={d.image_data} alt={d.title || "Dessin"} loading="lazy" width={800} height={800} className="aspect-square w-full object-cover" />
                <span
                  className={cn(
                    "absolute left-2 top-2 rounded-full border-2 border-ink px-2 py-0.5 font-display text-xs font-bold",
                    d.is_published ? "bg-accent" : "bg-secondary",
                  )}
                >
                  {d.is_published ? "Publié" : "Brouillon"}
                </span>
                <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-card opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="h-4 w-4" />
                </span>
              </div>
              <div className="px-1">
                <p className="truncate font-display font-bold">{d.title || "Sans titre"}</p>
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(d.updated_at), { locale: fr, addSuffix: true })}</span>
                  {d.is_published && (
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{d.hearts?.[0]?.count ?? 0}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{d.comments?.[0]?.count ?? 0}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
