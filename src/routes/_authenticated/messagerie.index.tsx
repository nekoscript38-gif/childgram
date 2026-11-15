import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Lock, Mail } from "lucide-react";
import { BanConversation } from "@/components/childgram/BanConversation";
import { banMessagesQuery, isAdminQuery, meQuery, myPrivateQuery } from "@/lib/queries";
import { canSendBanMessage } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/messagerie/")({
  beforeLoad: async ({ context }) => {
    const isAdmin = await context.queryClient.ensureQueryData(isAdminQuery);
    if (isAdmin) throw redirect({ to: "/admin" });
  },
  loader: async ({ context }) => {
    const [me, priv] = await Promise.all([
      context.queryClient.ensureQueryData(meQuery),
      context.queryClient.ensureQueryData(myPrivateQuery),
    ]);
    if (me && priv?.banned_at) await context.queryClient.ensureQueryData(banMessagesQuery(me.id));
  },
  head: () => ({
    meta: [
      { title: "Messagerie avec l'administratrice — ChildGram" },
      { name: "description", content: "Messagerie privée entre un profil banni et l'administratrice de ChildGram." },
      { property: "og:title", content: "Messagerie avec l'administratrice — ChildGram" },
      { property: "og:description", content: "Messagerie privée entre un profil banni et l'administratrice de ChildGram." },
    ],
  }),
  component: MessagingPage,
  errorComponent: RouteError,
});

function MessagingPage() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: priv } = useSuspenseQuery(myPrivateQuery);
  const banned = !!priv?.banned_at;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-4xl font-extrabold">
          <Mail className="h-9 w-9" /> Messagerie
        </h1>
        <p className="mt-1 font-semibold text-muted-foreground">
          Une conversation privée avec l'administratrice, seulement pour les profils bannis.
        </p>
      </div>

      {me && banned ? (
        <BanConversation
          userId={me.id}
          viewerId={me.id}
          viewerIsAdmin={false}
          canSend={canSendBanMessage({
            senderId: me.id,
            senderIsAdmin: false,
            conversationUserId: me.id,
            conversationUserBanned: banned,
          })}
          otherName="L'administratrice"
          closedMessage="La messagerie est fermée."
        />
      ) : (
        <div className="sticker space-y-3 p-6 text-center">
          <Lock className="mx-auto h-8 w-8" />
          <p className="font-display text-xl font-bold">La messagerie n'est pas disponible.</p>
          <p className="font-semibold text-muted-foreground">
            Elle s'ouvre seulement si ton profil est banni, pour parler avec l'administratrice.
          </p>
          <Link to="/fil" className="inline-block font-bold text-primary underline">Retour au fil</Link>
        </div>
      )}
    </div>
  );
}
