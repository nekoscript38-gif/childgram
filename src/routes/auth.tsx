import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/childgram/Logo";
import { AvatarPicker } from "@/components/childgram/AvatarPicker";
import {
  BIO_MAX,
  MIN_SIGNUP_AGE,
  PASSWORD_MIN,
  ageOn,
  isOldEnoughToSignUp,
  isValidUsername,
  needsParentalConsent,
  usernameToAuthEmail,
} from "@/lib/rules";
import { cn } from "@/lib/utils";

type Search = { mode?: "connexion" | "inscription" | undefined; redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "inscription" ? "inscription" : s["mode"] === "connexion" ? "connexion" : undefined,
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion ou inscription — ChildGram" },
      { name: "description", content: "Connecte-toi à ChildGram avec ton pseudo, ou crée ton compte de petit artiste." },
      { property: "og:title", content: "Connexion ou inscription — ChildGram" },
      { property: "og:description", content: "Connecte-toi à ChildGram avec ton pseudo, ou crée ton compte de petit artiste." },
    ],
  }),
  component: AuthPage,
});

function safeRedirect(r?: string) {
  if (!r) return "/fil";
  try {
    const url = new URL(r, window.location.origin);
    if (url.origin !== window.location.origin) return "/fil";
    return url.pathname + url.search;
  } catch {
    return "/fil";
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const mode = search.mode ?? "connexion";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safeRedirect(search.redirect), replace: true });
    });
  }, [navigate, search.redirect]);

  const done = () => navigate({ to: safeRedirect(search.redirect), replace: true });

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="sticker-lg p-5 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border-[2.5px] border-ink bg-muted p-1">
            {(["connexion", "inscription"] as const).map((m) => (
              <Link
                key={m}
                to="/auth"
                search={{ mode: m, redirect: search.redirect }}
                replace
                className={cn(
                  "rounded-full py-2 text-center font-display text-lg font-bold transition-all",
                  mode === m ? "bg-primary text-primary-foreground shadow-sticker-sm" : "text-muted-foreground",
                )}
              >
                {m === "connexion" ? "Se connecter" : "Créer un compte"}
              </Link>
            ))}
          </div>
          {mode === "connexion" ? <LoginForm onDone={done} /> : <SignupForm onDone={done} />}
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
          En utilisant ChildGram, tu acceptes nos{" "}
          <Link to="/conditions" className="underline hover:text-primary">conditions d'utilisation</Link> et notre{" "}
          <Link to="/confidentialite" className="underline hover:text-primary">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Cacher le mot de passe" : "Voir le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUsername(username)) { toast.error("Ce pseudo n'est pas valide"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Pseudo ou mot de passe incorrect");
      return;
    }
    toast.success("Re-bonjour, artiste !");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-3xl font-extrabold">Content de te revoir !</h1>
      <div className="space-y-2">
        <Label htmlFor="login-username" className="font-display text-base font-bold">Ton pseudo</Label>
        <Input id="login-username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex : Leo_42" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="font-display text-base font-bold">Ton mot de passe</Label>
        <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-center text-sm font-semibold text-muted-foreground">
        Mot de passe oublié ? Demande à ton parent de nous contacter.
      </p>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarId, setAvatarId] = useState(1);
  const [bio, setBio] = useState("");
  const [parentConsent, setParentConsent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const age = birthDate ? ageOn(birthDate) : NaN;
  const underAge = birthDate ? needsParentalConsent(birthDate) : false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUsername(username))
      { toast.error("Ton pseudo doit faire 3 à 20 caractères : lettres, chiffres ou _"); return; }
    if (password.length < PASSWORD_MIN)
      { toast.error(`Ton mot de passe doit faire au moins ${PASSWORD_MIN} caractères`); return; }
    if (password !== password2) { toast.error("Les deux mots de passe ne sont pas pareils"); return; }
    if (!birthDate || Number.isNaN(age) || birthDate > today) { toast.error("Indique une date de naissance valide"); return; }
    if (!isOldEnoughToSignUp(birthDate))
      { toast.error(`ChildGram est pour les enfants de ${MIN_SIGNUP_AGE} ans et plus (moyenne section et plus)`); return; }
    if (underAge && !parentConsent)
      { toast.error("Avant 13 ans, c'est un parent ou un représentant légal qui doit ouvrir le compte"); return; }
    if (!terms) { toast.error("Il faut accepter les conditions d'utilisation et la politique de confidentialité"); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: usernameToAuthEmail(username),
      password,
      options: {
        data: {
          username: username.trim(),
          birth_date: birthDate,
          avatar_id: avatarId,
          bio: bio.trim().slice(0, BIO_MAX),
          parental_consent: underAge ? parentConsent : false,
          terms_accepted: terms,
        },
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("too_young")) toast.error(`ChildGram est pour les enfants de ${MIN_SIGNUP_AGE} ans et plus (moyenne section et plus)`);
      else if (msg.includes("already")) toast.error("Ce pseudo est déjà pris, choisis-en un autre");
      else if (msg.includes("pwned") || msg.includes("weak") || msg.includes("known"))
        toast.error("Ce mot de passe est trop facile à deviner, choisis-en un autre");
      else toast.error("Impossible de créer le compte. Vérifie les informations et réessaie.");
      return;
    }
    if (!data.session) {
      toast.error("Compte créé, mais la connexion a échoué. Essaie de te connecter.");
      return;
    }
    toast.success("Bienvenue sur ChildGram !");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Crée ton compte</h1>
        <p className="mt-1 font-semibold text-muted-foreground">Pas besoin d'e-mail : juste un pseudo et un mot de passe.</p>
      </div>

      <div className="flex gap-3 rounded-2xl border-[2.5px] border-ink bg-accent p-4">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" />
        <p className="text-sm font-bold">
          Ne mets jamais ton vrai nom, ton adresse, ton école ou ton numéro de téléphone dans ton pseudo ou ta bio.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-username" className="font-display text-base font-bold">1. Ton pseudo</Label>
        <Input id="su-username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} placeholder="ex : DragonBleu_7" required />
        <p className="text-xs font-semibold text-muted-foreground">3 à 20 caractères : lettres, chiffres ou _ (sans accents ni espaces).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="su-password" className="font-display text-base font-bold">2. Mot de passe</Label>
          <PasswordInput id="su-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-password2" className="font-display text-base font-bold">Encore une fois</Label>
          <PasswordInput id="su-password2" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-birth" className="font-display text-base font-bold">3. Ta date de naissance</Label>
        <Input id="su-birth" type="date" max={today} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
        <p className="text-xs font-semibold text-muted-foreground">Elle reste secrète : personne d'autre ne la voit.</p>
        {birthDate && !Number.isNaN(age) && age < MIN_SIGNUP_AGE && (
          <p className="text-sm font-bold text-destructive">
            ChildGram est pour les enfants de {MIN_SIGNUP_AGE} ans et plus (moyenne section et plus).
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="font-display text-base font-bold">4. Choisis ton avatar</Label>
        <AvatarPicker value={avatarId} onChange={setAvatarId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="su-bio" className="font-display text-base font-bold">5. Ta bio (facultatif)</Label>
        <Textarea id="su-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={BIO_MAX} placeholder="J'adore dessiner des dragons et des fusées !" />
        <p className="text-right text-xs font-semibold text-muted-foreground">{bio.length}/{BIO_MAX}</p>
      </div>

      {underAge && (
        <div className="space-y-3 rounded-2xl border-[2.5px] border-ink bg-secondary p-4">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5" /> Espace parent
          </p>
          <p className="text-sm font-semibold">
            Cet enfant a moins de 13 ans. Le compte doit être ouvert par un parent ou un représentant légal, avec son autorisation formelle.
          </p>
          <label className="flex items-start gap-3">
            <Checkbox checked={parentConsent} onCheckedChange={(v) => setParentConsent(v === true)} className="mt-0.5" />
            <span className="text-sm font-bold">
              Je suis le parent ou le représentant légal de cet enfant. J'ouvre ce compte moi-même et je donne mon autorisation parentale formelle pour qu'il utilise ChildGram.
            </span>
          </label>
        </div>
      )}

      <label className="flex items-start gap-3">
        <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
        <span className="text-sm font-bold">
          J'ai lu et j'accepte les{" "}
          <Link to="/conditions" target="_blank" className="text-primary underline">conditions d'utilisation</Link> et la{" "}
          <Link to="/confidentialite" target="_blank" className="text-primary underline">politique de confidentialité</Link>.
        </span>
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
