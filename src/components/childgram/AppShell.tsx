import { Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Paintbrush, Plus, Settings, ShieldCheck, User } from "lucide-react";
import { isAdminQuery, meQuery } from "@/lib/queries";
import { Logo } from "./Logo";
import { KidAvatar } from "./Avatar";
import { SiteFooter } from "./SiteFooter";

const navClass =
  "flex items-center gap-2 rounded-full px-4 py-2 font-display font-bold text-foreground transition-colors hover:bg-muted";
const navActive = { className: "bg-secondary border-[2.5px] border-ink shadow-sticker-sm" };

export function AppShell() {
  const { data: me } = useQuery(meQuery);
  const { data: isAdmin } = useQuery(isAdminQuery);
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo to="/fil" />
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/fil" className={navClass} activeProps={navActive}>
              <Home className="h-4 w-4" /> Le fil
            </Link>
            <Link to="/studio" className={navClass} activeProps={navActive} activeOptions={{ exact: true }}>
              <Paintbrush className="h-4 w-4" /> Mon studio
            </Link>
            <Link to="/parametres" className={navClass} activeProps={navActive}>
              <Settings className="h-4 w-4" /> Réglages
            </Link>
            {isAdmin && (
              <Link to="/admin" className={navClass} activeProps={navActive}>
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Administration"
                className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-ink bg-accent text-accent-foreground shadow-sticker-sm md:hidden"
              >
                <ShieldCheck className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/studio/$drawingId"
              params={{ drawingId: "nouveau" }}
              className="hidden h-11 items-center gap-2 rounded-full border-[2.5px] border-ink bg-primary px-5 font-display font-bold text-primary-foreground shadow-sticker transition-transform hover:-translate-y-0.5 md:inline-flex"
            >
              <Plus className="h-4 w-4" strokeWidth={3} /> Dessiner
            </Link>
            {me && (
              <Link to="/profil/$username" params={{ username: me.username }} aria-label="Mon profil">
                <KidAvatar avatarId={me.avatar_id} size={44} className="shadow-sticker-sm" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <div className="hidden md:block">
        <SiteFooter />
      </div>

      <nav
        aria-label="Navigation"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full border-[3px] border-ink bg-card px-2 py-2 shadow-sticker-lg md:hidden"
      >
        <BottomLink to="/fil" label="Fil" icon={<Home className="h-5 w-5" />} />
        <BottomLink to="/studio" label="Studio" icon={<Paintbrush className="h-5 w-5" />} exact />
        <Link
          to="/studio/$drawingId"
          params={{ drawingId: "nouveau" }}
          aria-label="Nouveau dessin"
          className="-mt-8 grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-primary text-primary-foreground shadow-sticker"
        >
          <Plus className="h-7 w-7" strokeWidth={3} />
        </Link>
        {me ? (
          <Link
            to="/profil/$username"
            params={{ username: me.username }}
            className="flex flex-col items-center gap-0.5 px-3 text-xs font-bold text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <User className="h-5 w-5" />
            Profil
          </Link>
        ) : (
          <span className="w-12" />
        )}
        <BottomLink to="/parametres" label="Réglages" icon={<Settings className="h-5 w-5" />} />
      </nav>
    </div>
  );
}

function BottomLink({
  to,
  label,
  icon,
  exact,
}: {
  to: "/fil" | "/studio" | "/parametres";
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      className="flex flex-col items-center gap-0.5 px-3 text-xs font-bold text-muted-foreground"
      activeProps={{ className: "text-primary" }}
    >
      {icon}
      {label}
    </Link>
  );
}
