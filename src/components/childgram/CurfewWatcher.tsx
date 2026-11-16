import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CURFEW_BAN_TEXT } from "./BannedNotice";

type Status = "warning" | "banned";

/**
 * Asks the database whether this visit falls in the account's curfew hours (on app open and
 * when the tab comes back). The database counts the strikes and bans; this only shows the result.
 */
export function CurfewWatcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status | null>(null);
  const lastCheck = useRef(0);

  useEffect(() => {
    async function check() {
      if (Date.now() - lastCheck.current < 60_000) return;
      lastCheck.current = Date.now();
      const { data, error } = await supabase.rpc("check_curfew");
      if (error) return;
      if (data === "warning") setStatus("warning");
      if (data === "banned") {
        setStatus("banned");
        for (const key of [["me", "private"], ["profile"], ["feed"], ["ban-messages"], ["my-drawings"]]) {
          qc.invalidateQueries({ queryKey: key });
        }
      }
    }
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [qc]);

  return (
    <AlertDialog open={status !== null} onOpenChange={(open) => !open && setStatus(null)}>
      <AlertDialogContent className="border-[3px] border-ink">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Moon className="h-6 w-6" />
            {status === "banned" ? "Compte désactivé" : "Attention, couvre-feu !"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-semibold text-foreground">
            {status === "banned"
              ? `${CURFEW_BAN_TEXT} Tu peux écrire à l'administratrice si c'est une erreur.`
              : "À cette heure-ci, ChildGram est fermé pour ton âge. C'est un avertissement : si tu te connectes encore pendant ton couvre-feu, ton compte sera désactivé. Tu peux voir tes horaires dans tes réglages."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {status === "banned" ? (
            <AlertDialogAction onClick={() => navigate({ to: "/messagerie" })}>Écrire à l'administratrice</AlertDialogAction>
          ) : (
            <AlertDialogAction>J'ai compris</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
