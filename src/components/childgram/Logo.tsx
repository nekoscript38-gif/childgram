import { Link } from "@tanstack/react-router";
import { Palette } from "lucide-react";

export function Logo({ to = "/" }: { to?: "/" | "/fil" }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="ChildGram, accueil">
      <span className="grid h-10 w-10 place-items-center rounded-2xl border-[2.5px] border-ink bg-primary text-primary-foreground shadow-sticker-sm -rotate-6">
        <Palette className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">
        Child<span className="text-primary">Gram</span>
      </span>
    </Link>
  );
}
