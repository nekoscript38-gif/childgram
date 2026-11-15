import { Link } from "@tanstack/react-router";
import { Ban, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/** Red banner shown on a soft-banned profile (age set to 0 by the admin). */
export function BannedBanner({ self = false, className }: { self?: boolean; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border-[3px] border-ink bg-destructive p-4 text-destructive-foreground shadow-sticker",
        className,
      )}
    >
      <Ban className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={3} />
      <div>
        <p className="font-display text-xl font-extrabold uppercase tracking-wide">Profil banni</p>
        <p className="text-sm font-bold">
          {self
            ? "Ton compte a été bloqué par l'administratrice. Tu ne peux plus dessiner, publier, modifier ton profil, envoyer de cœurs ni de commentaires."
            : "Ce profil a été bloqué par l'administratrice de ChildGram."}
        </p>
        {self && (
          <Link
            to="/messagerie"
            className="mt-3 inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-card px-4 py-1.5 font-display font-bold text-foreground shadow-sticker-sm"
          >
            <Mail className="h-4 w-4" /> Écrire à l'administratrice
          </Link>
        )}
      </div>
    </div>
  );
}
