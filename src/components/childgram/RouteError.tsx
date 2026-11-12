import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="sticker mx-auto max-w-md space-y-4 p-6 text-center">
      <p className="font-display text-xl font-bold">Oups, quelque chose n'a pas marché.</p>
      <p className="text-sm font-semibold text-muted-foreground">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Button variant="outline" onClick={() => router.invalidate()}>Réessayer</Button>
    </div>
  );
}
