import { RouteError } from "@/components/childgram/RouteError";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Lock, LogOut, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarPicker } from "@/components/childgram/AvatarPicker";
import { KidAvatar } from "@/components/childgram/Avatar";
import { meQuery, myPrivateQuery } from "@/lib/queries";
import { BIO_MAX } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/parametres")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(meQuery),
      context.queryClient.ensureQueryData(myPrivateQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Réglages — ChildGram" },
      { name: "description", content: "Change ton avatar et ta bio sur ChildGram." },
      { property: "og:title", content: "Réglages — ChildGram" },
      { property: "og:description", content: "Change ton avatar et ta bio sur ChildGram." },
    ],
  }),
  component: Settings,
  errorComponent: RouteError,
  notFoundComponent: () => <p className="sticker p-6 font-bold">Rien ici.</p>,
});

function Settings() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: priv } = useSuspenseQuery(myPrivateQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [avatarId, setAvatarId] = useState(me?.avatar_id ?? 1);
  const [bio, setBio] = useState(me?.bio ?? "");
  const banned = !!priv?.banned_at;

  const save = useMutation({
    mutationFn: async () => {
      // Real block is RLS: a banned profile's update matches no row.
      if (banned) throw new Error("Ton profil est banni : tu ne peux plus le modifier.");
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_id: avatarId, bio: bio.trim().slice(0, BIO_MAX) })
        .eq("id", me!.id);
      if (error) throw new Error("Impossible d'enregistrer");
    },
    onSuccess: () => {
      toast.success("Profil mis à jour !");
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!me) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-4xl font-extrabold">Réglages</h1>

      <section className="sticker space-y-5 p-5">
        <div className="flex items-center gap-4">
          <KidAvatar avatarId={avatarId} size={80} className="shadow-sticker-sm" />
          <div>
            <p className="font-display text-2xl font-bold">@{me.username}</p>
            <p className="text-sm font-semibold text-muted-foreground">Ton pseudo ne peut pas être changé.</p>
          </div>
        </div>
        {banned && (
          <p className="rounded-2xl border-[2.5px] border-ink bg-destructive p-3 font-bold text-destructive-foreground">
            Ton profil est banni : tu ne peux plus changer ton avatar ni ta bio.
          </p>
        )}
        <fieldset disabled={banned} className="space-y-5 disabled:opacity-60">
        <div className="space-y-3">
          <Label className="font-display text-base font-bold">Ton avatar</Label>
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio" className="font-display text-base font-bold">Ta bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={BIO_MAX} placeholder="Parle de ce que tu aimes dessiner !" />
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Pas d'infos privées (nom, école, adresse…)</span>
            <span>{bio.length}/{BIO_MAX}</span>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={banned || save.isPending}>
          <Save /> {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        </fieldset>
      </section>

      <section className="sticker space-y-2 p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Lock className="h-5 w-5" /> Infos secrètes
        </h2>
        <p className="font-semibold text-muted-foreground">Ces infos ne sont visibles que par toi.</p>
        {priv && (
          <p className="font-bold">
            Date de naissance : {format(new Date(priv.birth_date + "T00:00:00"), "d MMMM yyyy", { locale: fr })}
          </p>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-sm font-bold">
          <Link to="/conditions" className="underline hover:text-primary">Conditions d'utilisation</Link>
          <Link to="/confidentialite" className="underline hover:text-primary">Confidentialité</Link>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut /> Se déconnecter
        </Button>
      </section>
    </div>
  );
}
