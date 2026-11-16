import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, Save, Eraser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminUserRow } from "@/lib/queries";
import { curfewFor, defaultCurfew, describeCurfew } from "@/lib/rules";

const t5 = (t: string | null) => (t ? t.slice(0, 5) : "");

/** Admin editor for one account's curfew hours (real check: profile_private UPDATE policy, admins only). */
export function CurfewEditor({ user, realAge }: { user: AdminUserRow; realAge: number }) {
  const qc = useQueryClient();
  const base = user.curfew_custom ? curfewFor(realAge, user) : defaultCurfew(realAge);
  const [custom, setCustom] = useState(user.curfew_custom);
  const [morning, setMorning] = useState(user.curfew_custom ? t5(user.curfew_morning) : (base?.morning ?? ""));
  const [evening, setEvening] = useState(user.curfew_custom ? t5(user.curfew_evening) : (base?.evening ?? ""));
  const [noonStart, setNoonStart] = useState(user.curfew_custom ? t5(user.curfew_noon_start) : (base?.noonStart ?? ""));
  const [noonEnd, setNoonEnd] = useState(user.curfew_custom ? t5(user.curfew_noon_end) : (base?.noonEnd ?? ""));

  const noonError = !!noonStart !== !!noonEnd || (!!noonStart && noonStart >= noonEnd);
  const dayError = !!morning && !!evening && morning >= evening;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const save = useMutation({
    mutationFn: async () => {
      if (custom && (noonError || dayError)) throw new Error("Horaires incohérents");
      const patch = custom
        ? {
            curfew_custom: true,
            curfew_morning: morning || null,
            curfew_evening: evening || null,
            curfew_noon_start: noonStart || null,
            curfew_noon_end: noonEnd || null,
          }
        : { curfew_custom: false, curfew_morning: null, curfew_evening: null, curfew_noon_start: null, curfew_noon_end: null };
      const { data, error } = await supabase.from("profile_private").update(patch).eq("user_id", user.id).select("user_id");
      if (error || !data?.length) throw new Error("Impossible d'enregistrer le couvre-feu");
    },
    onSuccess: () => {
      toast.success(`Couvre-feu de @${user.username} enregistré`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearStrikes = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("profile_private")
        .update({ curfew_strikes: 0 })
        .eq("user_id", user.id)
        .select("user_id");
      if (error || !data?.length) throw new Error("Impossible d'effacer les avertissements");
    },
    onSuccess: () => {
      toast.success(`Avertissements de @${user.username} effacés`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-4 rounded-2xl border-[2.5px] border-ink bg-muted p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Switch id={`curfew-custom-${user.id}`} checked={custom} onCheckedChange={setCustom} />
          <Label htmlFor={`curfew-custom-${user.id}`} className="font-display font-bold">
            Horaires personnalisés
          </Label>
        </div>
        {user.curfew_strikes > 0 && !user.banned_at && (
          <Button type="button" size="sm" variant="outline" disabled={clearStrikes.isPending} onClick={() => clearStrikes.mutate()}>
            <Eraser /> Effacer l'avertissement
          </Button>
        )}
      </div>

      {!custom ? (
        <p className="text-sm font-semibold">
          Horaires selon l'âge ({Number.isNaN(realAge) ? "?" : realAge} ans) : {describeCurfew(defaultCurfew(realAge)).join(" · ")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <TimeField id={`m-${user.id}`} label="Pas de connexion avant" value={morning} onChange={setMorning} />
          <TimeField id={`e-${user.id}`} label="Pas de connexion à partir de" value={evening} onChange={setEvening} />
          <TimeField id={`ns-${user.id}`} label="Après-midi : fermé de" value={noonStart} onChange={setNoonStart} />
          <TimeField id={`ne-${user.id}`} label="Après-midi : jusqu'à" value={noonEnd} onChange={setNoonEnd} />
          <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">
            Laisse une case vide pour ne pas mettre de limite. L'après-midi ne compte pas le mercredi ni le week-end. Heure de Paris.
            {dayError && <span className="block font-bold text-destructive">Le matin doit être avant le soir.</span>}
            {noonError && <span className="block font-bold text-destructive">Remplis les deux heures de l'après-midi, la première avant la seconde.</span>}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={save.isPending || (custom && (noonError || dayError))}>
          <Save /> Enregistrer
        </Button>
        {user.curfew_custom && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={save.isPending}
            onClick={() => {
              setCustom(false);
              const d = defaultCurfew(realAge);
              setMorning(d?.morning ?? "");
              setEvening(d?.evening ?? "");
              setNoonStart(d?.noonStart ?? "");
              setNoonEnd(d?.noonEnd ?? "");
            }}
          >
            <RotateCcw /> Revenir aux horaires par âge
          </Button>
        )}
      </div>
    </form>
  );
}

function TimeField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-bold">
        {label}
      </Label>
      <Input id={id} type="time" value={value} onChange={(e) => onChange(e.target.value)} className="w-36 bg-card" />
    </div>
  );
}
