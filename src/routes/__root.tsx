import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { isChunkLoadError, reloadForStaleChunk } from "@/lib/chunk-reload";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="sticker-lg max-w-md p-8 text-center">
        <h1 className="text-7xl font-extrabold text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-bold">Oups, cette page s'est envolée !</h2>
        <p className="mt-2 text-muted-foreground">Elle n'existe pas ou a été déplacée.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full border-[2.5px] border-ink bg-primary px-5 font-display font-bold text-primary-foreground shadow-sticker"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const staleChunk = isChunkLoadError(error);
  useEffect(() => {
    // An old open page asking for files replaced by an update: reload once to get the new ones.
    if (staleChunk && reloadForStaleChunk()) return;
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error, staleChunk]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="sticker-lg max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold">Cette page n'a pas pu se charger</h1>
        <p className="mt-2 text-muted-foreground">Un petit souci de notre côté. Réessaie dans un instant.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-full border-[2.5px] border-ink bg-primary px-5 font-display font-bold text-primary-foreground shadow-sticker"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border-[2.5px] border-ink bg-card px-5 font-display font-bold shadow-sticker"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ChildGram — le réseau des petits artistes" },
      { name: "description", content: "Dessine, publie et partage tes créations avec d'autres enfants." },
      { property: "og:title", content: "ChildGram — le réseau des petits artistes" },
      { property: "og:description", content: "Dessine, publie et partage tes créations avec d'autres enfants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      queryClient.invalidateQueries({ queryKey: ["session"] });
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

  useEffect(() => {
    const onPreloadError = (e: Event) => {
      e.preventDefault();
      reloadForStaleChunk();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkLoadError(e.reason)) reloadForStaleChunk();
    };
    window.addEventListener("vite:preloadError", onPreloadError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
