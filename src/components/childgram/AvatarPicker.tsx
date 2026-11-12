import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function AvatarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (id: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Choisis ton avatar" className="grid grid-cols-5 gap-2 sm:gap-3">
      {AVATARS.map((a) => {
        const selected = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={a.name}
            onClick={() => onChange(a.id)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-2xl border-[2.5px] border-ink transition-all",
              selected
                ? "scale-105 shadow-sticker ring-4 ring-primary"
                : "opacity-80 hover:opacity-100 hover:-translate-y-0.5",
            )}
          >
            <img src={a.src} alt="" loading="lazy" width={256} height={256} className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
