import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Ban, Mail } from "lucide-react";
import { KidAvatar } from "@/components/childgram/Avatar";
import { BanConversation } from "@/components/childgram/BanConversation";
import { adminUsersQuery, banMessagesQuery, isAdminQuery, meQuery } from "@/lib/queries";
import { canSendBanMessage } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/messagerie/$userId")({
  beforeLoad: async ({ context }) => {
    const isAdmin = await context.queryClient.ensureQueryData(isAdminQuery);
    if (!isAdmin) throw redirect({ to: "/messagerie" });
  },
  loader: async ({ context, params }) => {
    const [users] = await Promise.all([
      context.queryClient.ensureQueryData(adminUsersQuery),
      context.queryClient.ensureQueryData(meQuery),
      context.queryClient.ensureQueryData(banMessagesQuery(params.userId)),
    ]);
    if (!users.some((u) => u.id === params.userId)) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Messagerie admin — ChildGram" },
      { name: "description", content: "Conversation privée de l'administratrice avec un profil banni." },
      { property: "og:title", content: "Messagerie admin — ChildGram" },
      { property: "og:description", content: "Conversation privée de l'administratrice avec un profil banni." },
    ],
  }),
  component: AdminConversationPage,
  errorComponent: RouteError,
  notFoundComponent: () => (
    <div className="sticker mx-auto max-w-md p-8 text-center">
      <p className="font-display text-2xl font-bold">Ce compte n'existe pas.</p>
      <Link to="/admin" className="mt-4 inline-block font-bold text-primary underline">Retour à l'administration</Link>
    </div>
  ),
});

function AdminConversationPage() {
  const { userId } = Route.useParams();
  const { data: users } = useSuspenseQuery(adminUsersQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  const user = users.find((u) => u.id === userId);
  if (!user || !me) return null;
  const banned = !!user.banned_at;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 font-bold text-primary underline">
        <ArrowLeft className="h-4 w-4" /> Administration
      </Link>
      <div className="flex items-center gap-4">
        <KidAvatar avatarId={user.avatar_id} size={60} />
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold">
            <Mail className="h-7 w-7" /> @{user.username}
          </h1>
          {banned ? (
            <p className="flex items-center gap-1 text-sm font-bold text-destructive">
              <Ban className="h-4 w-4" /> Profil banni : la messagerie est ouverte
            </p>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">Profil non banni : la messagerie est fermée</p>
          )}
        </div>
      </div>
      <BanConversation
        userId={user.id}
        viewerId={me.id}
        viewerIsAdmin
        canSend={canSendBanMessage({
          senderId: me.id,
          senderIsAdmin: true,
          conversationUserId: user.id,
          conversationUserBanned: banned,
        })}
        otherName={`@${user.username}`}
        closedMessage="Ce profil n'est pas banni : tu ne peux pas lui écrire ici. L'historique reste visible pour toi seule."
      />
    </div>
  );
}
