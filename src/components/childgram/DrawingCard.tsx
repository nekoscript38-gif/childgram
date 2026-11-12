import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import type { DrawingCard as DrawingCardType } from "@/lib/queries";
import { KidAvatar } from "./Avatar";
import { HeartButton } from "./HeartButton";
import { cn } from "@/lib/utils";

const TILTS = ["rotate-[-1.2deg]", "rotate-[0.8deg]", "rotate-[-0.4deg]", "rotate-[1.4deg]"];

export function DrawingCard({
  drawing,
  liked,
  index = 0,
  showAuthor = true,
}: {
  drawing: DrawingCardType;
  liked: boolean;
  index?: number;
  showAuthor?: boolean;
}) {
  const hearts = drawing.hearts?.[0]?.count ?? 0;
  const comments = drawing.comments?.[0]?.count ?? 0;
  return (
    <article
      className={cn(
        "sticker relative flex flex-col gap-3 p-3 transition-transform hover:rotate-0 hover:-translate-y-1",
        TILTS[index % TILTS.length],
      )}
    >
      <span className="tape" aria-hidden />
      <Link
        to="/dessin/$drawingId"
        params={{ drawingId: drawing.id }}
        className="block overflow-hidden rounded-xl border-[2.5px] border-ink bg-paper"
      >
        <img
          src={drawing.image_data}
          alt={drawing.title || "Dessin"}
          loading="lazy"
          width={800}
          height={800}
          className="aspect-square w-full object-cover"
        />
      </Link>
      <div className="flex items-center justify-between gap-2">
        {showAuthor && drawing.profiles ? (
          <Link
            to="/profil/$username"
            params={{ username: drawing.profiles.username }}
            className="flex min-w-0 items-center gap-2"
          >
            <KidAvatar avatarId={drawing.profiles.avatar_id} size={34} />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight">
                {drawing.title || "Sans titre"}
              </p>
              <p className="truncate text-xs font-bold text-muted-foreground">@{drawing.profiles.username}</p>
            </div>
          </Link>
        ) : (
          <p className="truncate font-display text-base font-bold">{drawing.title || "Sans titre"}</p>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          <HeartButton drawingId={drawing.id} count={hearts} liked={liked} />
          <Link
            to="/dessin/$drawingId"
            params={{ drawingId: drawing.id }}
            aria-label={`${comments} commentaires`}
            className="inline-flex h-9 items-center gap-1 rounded-full border-[2.5px] border-ink bg-card px-3 font-display text-sm font-bold shadow-sticker-sm hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
            {comments}
          </Link>
        </div>
      </div>
    </article>
  );
}
