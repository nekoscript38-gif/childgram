import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Lock, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { banMessagesQuery } from "@/lib/queries";
import { BAN_MESSAGE_MAX } from "@/lib/rules";
import { cn } from "@/lib/utils";

/**
 * Private conversation between the admin and one banned profile.
 * Who can read/write is enforced by the ban_messages RLS policies.
 */
export function BanConversation({
  userId,
  viewerId,
  viewerIsAdmin,
  canSend,
  otherName,
  closedMessage,
}: {
  userId: string;
  viewerId: string;
  viewerIsAdmin: boolean;
  canSend: boolean;
  otherName: string;
  closedMessage: string;
}) {
  const { data: messages } = useSuspenseQuery(banMessagesQuery(userId));
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async () => {
      const content = text.trim();
      if (!content) throw new Error("Écris ton message d'abord");
      const { error } = await supabase
        .from("ban_messages")
        .insert({ user_id: userId, sender_id: viewerId, content: content.slice(0, BAN_MESSAGE_MAX) });
      if (error) {
        if (error.code === "42501") throw new Error("La messagerie est fermée : le profil n'est plus banni.");
        throw new Error("Impossible d'envoyer ton message");
      }
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["ban-messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="sticker space-y-4 p-5">
      {messages.length === 0 && (
        <p className="font-semibold text-muted-foreground">
          {viewerIsAdmin
            ? "Pas encore de message. Tu peux expliquer ici la raison du bannissement."
            : "Pas encore de message. Tu peux écrire à l'administratrice pour comprendre ou contester ton bannissement."}
        </p>
      )}
      <ul className="space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === viewerId;
          const fromAdmin = m.sender_id !== m.user_id;
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border-[2.5px] border-ink px-4 py-2",
                  mine ? "bg-secondary" : "bg-muted",
                )}
              >
                <p className="flex items-center gap-1 font-display text-sm font-bold">
                  {fromAdmin && <ShieldCheck className="h-3.5 w-3.5" />}
                  {mine ? "Toi" : otherName}
                </p>
                <p className="whitespace-pre-wrap break-words font-semibold">{m.content}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  {format(new Date(m.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={endRef} />

      {canSend ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
          className="space-y-2"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={BAN_MESSAGE_MAX}
            placeholder={viewerIsAdmin ? "Explique la raison du bannissement…" : "Écris à l'administratrice…"}
            aria-label="Ton message"
            rows={4}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">
              {text.length}/{BAN_MESSAGE_MAX}
            </span>
            <Button type="submit" disabled={send.isPending || !text.trim()}>
              <Send /> Envoyer
            </Button>
          </div>
        </form>
      ) : (
        <p className="flex items-start gap-2 rounded-2xl border-[2.5px] border-ink bg-secondary p-3 text-sm font-bold">
          <Lock className="h-4 w-4 shrink-0" /> {closedMessage}
        </p>
      )}
    </div>
  );
}
