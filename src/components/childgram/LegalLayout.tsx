import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { SiteFooter } from "./SiteFooter";

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <article className="sticker-lg prose-legal p-6 sm:p-10">
          <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground">Dernière mise à jour : {updated}</p>
          <div className="mt-6 font-semibold">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
