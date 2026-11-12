import { avatarName, avatarSrc } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function KidAvatar({
  avatarId,
  size = 40,
  className,
}: {
  avatarId: number | null | undefined;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={avatarSrc(avatarId)}
      alt={avatarName(avatarId)}
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-full border-[2.5px] border-ink object-cover bg-card", className)}
    />
  );
}
