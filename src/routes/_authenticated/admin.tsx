import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Ban, Check, Mail, Moon, Search, ShieldCheck, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KidAvatar } from "@/components/childgram/Avatar";
import { adminBanInboxQuery, adminUsersQuery, isAdminQuery, meQuery, type AdminUserRow } from "@/lib/queries";
import { ageOn, CURFEW_STRIKES_TO_BAN, curfewFor, describeCurfew, effectiveAge, isAllowedAdminBirthDate, needsParentalConsent } from "@/lib/rules";
import { CurfewEditor } from "@/components/childgram/CurfewEditor";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const isAdmin = await context.queryClient.ensureQueryData(isAdminQuery);
    if (!isAdmin) throw redirect({ to: "/fil" });
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminUsersQuery),
      context.queryClient.ensureQueryData(meQuery),
      context.queryClient.ensureQueryData(adminBanInboxQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Administration — ChildGram" },
      { name: "description", content: "Espace administratrice de ChildGram : vérification des âges." },
      { property: "og:title", content: "Administration — ChildGram" },
      { property: "og:description", content: "Espace administratrice de ChildGram : vérification des âges." },
    ],
  }),
  component: AdminPage,
  errorComponent: RouteError,
});

function AdminPage() {
  const { data: users } = useSuspenseQuery(adminUsersQuery);
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: inbox } = useSuspenseQuery(adminBanInboxQuery);
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => users.filter((u) => u.username.toLowerCase().includes(q.trim().toLowerCase())),
    [users, q],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-extrabold">
            <ShieldCheck className="h-9 w-9" /> Administration
          </h1>
          <p className="mt-1 font-semibold text-muted-foreground">
            {users.length} compte{users.length > 1 ? "s" : ""}. Les dates de naissance ne sont visibles que par toi.
            {" "}« Mettre à 0 an » bannit un profil jusqu'à ce que tu remontes son âge ;
            {" "}« Messages » te permet alors de lui expliquer pourquoi. Après {CURFEW_STRIKES_TO_BAN} connexions pendant son
            {" "}couvre-feu, un compte est mis à 0 an automatiquement.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un pseudo" className="pl-9" />
        </div>
      </div>

      <ul className="space-y-4">
        {filtered.map((u) => (
          <UserRow key={u.id} user={u} isMe={u.id === me?.id} inbox={inbox[u.id]} />
        ))}
        {filtered.length === 0 && (
          <li className="sticker p-6 text-center font-bold">Aucun compte trouvé.</li>
        )}
      </ul>
    </div>
  );
}

function UserRow({
  user,
  isMe,
  inbox,
}: {
  user: AdminUserRow;
  isMe: boolean;
  inbox?: { sender_id: string; created_at: string; count: number } | undefined;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState(user.birth_date ?? "");
  const changed = date !== (user.birth_date ?? "");
  const valid = isAllowedAdminBirthDate(date);
  const banned = !!user.banned_at;
  const age = user.birth_date ? effectiveAge(user.birth_date, user.banned_at) : null;
  const newAge = valid ? ageOn(date) : null;
  const missingConsent = user.birth_date && needsParentalConsent(user.birth_date) && !user.parental_consent;
  const today = format(new Date(), "yyyy-MM-dd");
  const [curfewOpen, setCurfewOpen] = useState(false);
  const realAge = user.birth_date ? ageOn(user.birth_date) : NaN;
  const curfew = curfewFor(realAge, user);

  const save = useMutation({
    mutationFn: async () => {
      if (!isAllowedAdminBirthDate(date)) throw new Error("Date invalide (pour 0 an, utilise « Mettre à 0 an »)");
      const { data, error } = await supabase
        .from("profile_private")
        .update({ birth_date: date })
        .eq("user_id", user.id)
        .select("user_id");
      if (error || !data?.length) throw new Error("Impossible d'enregistrer la date");
    },
    onSuccess: () => {
      toast.success(`Date de naissance de @${user.username} corrigée`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["me", "private"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setBan = useMutation({
    mutationFn: async (ban: boolean) => {
      const { data, error } = await supabase
        .from("profile_private")
        .update({ banned_at: ban ? new Date().toISOString() : null })
        .eq("user_id", user.id)
        .select("user_id");
      if (error || !data?.length) throw new Error("Impossible de changer le statut de ce profil");
    },
    onSuccess: (_d, ban) => {
      toast.success(ban ? `@${user.username} est à 0 an : profil banni` : `Âge de @${user.username} remonté`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["ban-messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className={`sticker space-y-4 p-4 ${banned ? "border-destructive" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Link to="/profil/$username" params={{ username: user.username }} className="flex min-w-0 flex-1 items-center gap-3">
        <KidAvatar avatarId={user.avatar_id} size={52} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">@{user.username}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            Inscrit le {format(new Date(user.created_at), "d MMM yyyy", { locale: fr })}
            {" · "}
            {user.parental_consent ? "Accord parental donné" : "Sans accord parental"}
          </p>
          {banned && (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-destructive">
              <Ban className="h-3.5 w-3.5" /> Profil banni (0 an) depuis le {format(new Date(user.banned_at!), "d MMM yyyy", { locale: fr })}
              {user.ban_reason === "curfew" && " · automatiquement (couvre-feu)"}
            </p>
          )}
          {!isMe && (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Moon className="h-3.5 w-3.5 shrink-0" />
              {user.curfew_custom ? "Couvre-feu perso : " : "Couvre-feu : "}
              {describeCurfew(curfew).join(" · ")}
              {user.curfew_strikes > 0 && (
                <span className="font-bold text-destructive">
                  {" "}· {user.curfew_strikes}/{CURFEW_STRIKES_TO_BAN} connexion{user.curfew_strikes > 1 ? "s" : ""} suspecte{user.curfew_strikes > 1 ? "s" : ""}
                </span>
              )}
            </p>
          )}
          {inbox && inbox.sender_id === user.id && (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-primary">
              <Mail className="h-3.5 w-3.5" /> Dernier message de @{user.username} le{" "}
              {format(new Date(inbox.created_at), "d MMM 'à' HH:mm", { locale: fr })}
            </p>
          )}
          {missingConsent && (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> Moins de 13 ans sans accord parental
            </p>
          )}
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-1 font-display font-bold ${banned ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`}
        >
          {age ?? "?"} an{age !== null && age > 1 ? "s" : ""}
        </span>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input
            type="date"
            aria-label={`Date de naissance de ${user.username}`}
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button type="submit" size="sm" disabled={!changed || !valid || save.isPending} aria-label="Enregistrer la date">
            <Check />
            {changed && newAge !== null ? `${newAge} ans` : "OK"}
          </Button>
        </form>
        {!isMe && (banned || inbox) && (
          <Button asChild size="sm" variant="outline">
            <Link to="/messagerie/$userId" params={{ userId: user.id }}>
              <Mail /> Messages{inbox ? ` (${inbox.count})` : ""}
            </Link>
          </Button>
        )}
        {!isMe &&
          (banned ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={setBan.isPending}
              onClick={() => setBan.mutate(false)}
            >
              <Undo2 /> Remonter à {user.birth_date ? ageOn(user.birth_date) : "?"} ans
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={setBan.isPending}
              onClick={() => {
                if (window.confirm(`Mettre @${user.username} à 0 an ? Son profil sera banni jusqu'à ce que tu remontes son âge.`)) {
                  setBan.mutate(true);
                }
              }}
            >
              <Ban /> Mettre à 0 an
            </Button>
          ))}
        {!isMe && (
          <Button type="button" size="sm" variant="secondary" aria-expanded={curfewOpen} onClick={() => setCurfewOpen((o) => !o)}>
            <Moon /> Couvre-feu
          </Button>
        )}
      </div>
      </div>
      {curfewOpen && !isMe && <CurfewEditor user={user} realAge={realAge} />}
    </li>
  );
}
