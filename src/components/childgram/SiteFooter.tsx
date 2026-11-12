import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-[3px] border-ink bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm font-bold sm:flex-row">
        <p className="text-muted-foreground">© {new Date().getFullYear()} ChildGram — fait avec ❤️ pour les petits artistes</p>
        <nav className="flex gap-4">
          <Link to="/conditions" className="hover:text-primary">Conditions d'utilisation</Link>
          <Link to="/confidentialite" className="hover:text-primary">Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
