import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Paintbrush, ShieldCheck } from "lucide-react";
import heroDrawings from "@/assets/hero-drawings.jpg";
import { Logo } from "@/components/childgram/Logo";
import { SiteFooter } from "@/components/childgram/SiteFooter";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/avatars";
import { sessionQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChildGram — dessine et partage tes créations" },
      {
        name: "description",
        content: "ChildGram, le réseau social des enfants artistes : dessine dans ton studio, publie et reçois des cœurs.",
      },
      { property: "og:title", content: "ChildGram — dessine et partage tes créations" },
      {
        property: "og:description",
        content: "Le réseau social des enfants artistes : dessine, publie et reçois des cœurs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: userId } = useQuery(sessionQuery);
  const signedIn = !!userId;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        {signedIn ? (
          <Button asChild size="sm">
            <Link to="/fil">Mon fil</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/auth" search={{ mode: "connexion" }}>Se connecter</Link>
          </Button>
        )}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-6 md:grid-cols-2 md:pt-12">
        <div>
          <span className="inline-block -rotate-2 rounded-full border-[2.5px] border-ink bg-secondary px-4 py-1 font-display font-bold shadow-sticker-sm">
            Pour les petits artistes ✏️
          </span>
          <h1 className="mt-5 text-5xl font-extrabold sm:text-6xl lg:text-7xl">
            Dessine.
            <br />
            <span className="text-primary">Publie.</span>
            <br />
            Reçois des <span className="text-heart">cœurs</span>.
          </h1>
          <p className="mt-5 max-w-md text-lg font-semibold text-muted-foreground">
            ChildGram, c'est ton carnet de dessins en ligne. Crée dans ton studio, partage tes œuvres et découvre celles des autres enfants.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? (
              <>
                <Button asChild size="lg">
                  <Link to="/studio/$drawingId" params={{ drawingId: "nouveau" }}>Je dessine !</Link>
                </Button>
                <Button asChild size="lg" variant="sun">
                  <Link to="/fil">Voir le fil</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "inscription" }}>Créer mon compte</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth" search={{ mode: "connexion" }}>J'ai déjà un compte</Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-3">
              {AVATARS.slice(0, 6).map((a) => (
                <img key={a.id} src={a.src} alt="" width={44} height={44} className="h-11 w-11 rounded-full border-[2.5px] border-ink object-cover" />
              ))}
            </div>
            <p className="text-sm font-bold text-muted-foreground">20 avatars rigolos à choisir</p>
          </div>
        </div>
        <div className="relative">
          <div className="sticker-lg rotate-2 overflow-hidden p-2">
            <img src={heroDrawings} alt="Des dessins d'enfants colorés accrochés au mur" width={1280} height={960} className="w-full rounded-xl" />
          </div>
          <div className="absolute -bottom-5 -left-3 flex animate-wiggle items-center gap-2 rounded-full border-[2.5px] border-ink bg-heart px-4 py-2 font-display font-bold text-heart-foreground shadow-sticker">
            <Heart className="h-5 w-5" fill="currentColor" /> +12 cœurs
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature color="bg-secondary" icon={<Paintbrush className="h-7 w-7" />} title="Ton studio">
            25 couleurs, 8 tailles de pinceau, un spectre pour inventer tes propres couleurs, 50 emojis et 30 décorations à coller où tu veux.
          </Feature>
          <Feature color="bg-accent" icon={<MessageCircle className="h-7 w-7" />} title="Partage">
            Publie tes dessins sur ton profil. Les autres enfants peuvent t'envoyer des cœurs et des mots gentils.
          </Feature>
          <Feature color="bg-sky" icon={<ShieldCheck className="h-7 w-7" />} title="En sécurité">
            Pas d'e-mail, pas de photo, pas de lien : juste un pseudo et un avatar dessiné.
          </Feature>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Feature({ color, icon, title, children }: { color: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="sticker p-6">
      <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl border-[2.5px] border-ink ${color} shadow-sticker-sm`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-2 font-semibold text-muted-foreground">{children}</p>
    </div>
  );
}
