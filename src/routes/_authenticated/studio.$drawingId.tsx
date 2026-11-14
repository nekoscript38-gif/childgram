import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { DrawingStudio } from "@/components/childgram/DrawingStudio";
import { editableDrawingQuery, myPrivateQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/studio/$drawingId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(myPrivateQuery);
    if (params.drawingId === "nouveau") return;
    const d = await context.queryClient.ensureQueryData(editableDrawingQuery(params.drawingId));
    if (!d) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Studio — ChildGram" },
      { name: "description", content: "Dessine avec 25 couleurs, 8 pinceaux et le spectre de couleurs." },
      { property: "og:title", content: "Studio — ChildGram" },
      { property: "og:description", content: "Dessine avec 25 couleurs, 8 pinceaux et le spectre de couleurs." },
    ],
  }),
  component: StudioEditor,
  errorComponent: RouteError,
  notFoundComponent: () => (
    <div className="sticker p-8 text-center">
      <p className="font-display text-2xl font-bold">Ce dessin est introuvable.</p>
      <Link to="/studio" className="mt-4 inline-block font-bold text-primary underline">Retour au studio</Link>
    </div>
  ),
});

function StudioEditor() {
  const { drawingId } = Route.useParams();
  const { data: priv } = useSuspenseQuery(myPrivateQuery);
  if (priv?.banned_at) {
    return (
      <div className="sticker mx-auto max-w-md p-8 text-center">
        <Ban className="mx-auto h-10 w-10 text-destructive" strokeWidth={3} />
        <p className="mt-2 font-display text-2xl font-bold">Le studio est fermé pour ton compte.</p>
        <p className="mt-1 font-semibold text-muted-foreground">Ton profil a été banni : tu ne peux plus dessiner ni publier.</p>
        <Link to="/studio" className="mt-4 inline-block font-bold text-primary underline">Retour au studio</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/studio" className="grid h-10 w-10 place-items-center rounded-full border-[2.5px] border-ink bg-card shadow-sticker-sm" aria-label="Retour au studio">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-extrabold">{drawingId === "nouveau" ? "Nouveau dessin" : "Modifier mon dessin"}</h1>
      </div>
      {drawingId === "nouveau" ? (
        <DrawingStudio key="new" initial={{ id: null, title: "", image_data: null, is_published: false }} />
      ) : (
        <ExistingDrawing id={drawingId} />
      )}
    </div>
  );
}

function ExistingDrawing({ id }: { id: string }) {
  const { data } = useSuspenseQuery(editableDrawingQuery(id));
  if (!data) return null;
  return (
    <DrawingStudio
      key={data.id}
      initial={{ id: data.id, title: data.title, image_data: data.image_data, is_published: data.is_published }}
    />
  );
}
