import { CheckCircle2, PenLine } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PARENT_PHRASE, PARENT_PHRASE_COPIES, isParentPhraseCopyCorrect } from "@/lib/rules";
import { cn } from "@/lib/utils";

/**
 * Sign-up step for children aged 7 or less: the parent copies the sentence by hand, 3 times.
 * Pasting is blocked so it really is copied. The database checks the copies again.
 */
export function ParentPhraseCheck({ copies, onChange }: { copies: string[]; onChange: (copies: string[]) => void }) {
  const block = (e: React.SyntheticEvent) => e.preventDefault();
  return (
    <div className="space-y-3 rounded-2xl border-[2.5px] border-ink bg-card p-4">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <PenLine className="h-5 w-5" /> Vérification du parent
      </p>
      <p className="text-sm font-semibold">
        L'enfant a 7 ans ou moins. Le parent doit recopier cette phrase {PARENT_PHRASE_COPIES} fois, sans faire de fautes :
      </p>
      <blockquote
        className="select-none rounded-xl border-[2px] border-ink bg-muted p-3 text-sm font-bold"
        onCopy={block}
        onContextMenu={block}
      >
        « {PARENT_PHRASE} »
      </blockquote>
      <p className="text-xs font-semibold text-muted-foreground">
        Le copier-coller ne marche pas : il faut l'écrire. Les majuscules ne comptent pas, mais les accents et la virgule, si.
      </p>
      {Array.from({ length: PARENT_PHRASE_COPIES }, (_, i) => {
        const value = copies[i] ?? "";
        const ok = isParentPhraseCopyCorrect(value);
        const showError = !ok && value.trim().length >= PARENT_PHRASE.length - 5;
        return (
          <div key={i} className="space-y-1">
            <Label htmlFor={`parent-phrase-${i}`} className="font-display text-sm font-bold">
              Copie {i + 1} sur {PARENT_PHRASE_COPIES}
            </Label>
            <Textarea
              id={`parent-phrase-${i}`}
              value={value}
              rows={3}
              autoComplete="off"
              onPaste={block}
              onDrop={block}
              onChange={(e) => {
                const next = [...copies];
                next[i] = e.target.value;
                onChange(next);
              }}
              className={cn(ok && "border-primary")}
            />
            {ok && (
              <p className="flex items-center gap-1 text-sm font-bold text-primary">
                <CheckCircle2 className="h-4 w-4" /> Sans faute !
              </p>
            )}
            {showError && <p className="text-sm font-bold text-destructive">Il y a une différence avec la phrase. Vérifie chaque mot.</p>}
          </div>
        );
      })}
    </div>
  );
}
