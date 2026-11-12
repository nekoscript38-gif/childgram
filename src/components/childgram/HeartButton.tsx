import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function HeartButton({
  drawingId,
  count,
  liked,
  disabled,
  size = "sm",
}: {
  drawingId: string;
  count: number;
  liked: boolean;
  disabled?: boolean;
  size?: "sm" | "lg";
}) {
  const qc = useQueryClient();
  const [bump, setBump] = useState(0);
  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Connecte-toi pour envoyer un cœur");
      if (next) {
        const { error } = await supabase.from("hearts").insert({ drawing_id: drawingId, user_id: u.user.id });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("hearts")
          .delete()
          .eq("drawing_id", drawingId)
          .eq("user_id", u.user.id);
        if (error) throw error;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-hearts"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["drawing", drawingId] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const optimisticLiked = mutation.isPending ? (mutation.variables as boolean) : liked;
  const optimisticCount = mutation.isPending ? count + (optimisticLiked ? 1 : 0) - (liked ? 1 : 0) : count;

  return (
    <button
      type="button"
      disabled={disabled || mutation.isPending}
      aria-pressed={optimisticLiked}
      aria-label={optimisticLiked ? "Retirer mon cœur" : "Envoyer un cœur"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setBump((b) => b + 1);
        mutation.mutate(!liked);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-[2.5px] border-ink font-display font-bold transition-all disabled:cursor-not-allowed",
        size === "lg" ? "h-12 px-5 text-lg shadow-sticker" : "h-9 px-3 text-sm shadow-sticker-sm",
        optimisticLiked ? "bg-heart text-heart-foreground" : "bg-card text-foreground hover:bg-muted",
      )}
    >
      <Heart
        key={bump}
        className={cn(size === "lg" ? "h-5 w-5" : "h-4 w-4", bump > 0 && "animate-pop")}
        fill={optimisticLiked ? "currentColor" : "none"}
        strokeWidth={2.5}
      />
      {optimisticCount}
    </button>
  );
}
