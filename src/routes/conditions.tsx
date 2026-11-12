import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout } from "@/components/childgram/LegalLayout";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — ChildGram" },
      { name: "description", content: "Les règles d'utilisation de ChildGram, le réseau social de dessins pour enfants." },
      { property: "og:title", content: "Conditions d'utilisation — ChildGram" },
      { property: "og:description", content: "Les règles d'utilisation de ChildGram, le réseau social de dessins pour enfants." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalLayout title="Conditions d'utilisation" updated="12 novembre 2026">
      <p>
        Bienvenue sur ChildGram ! ChildGram est une plateforme où les enfants peuvent dessiner, publier leurs dessins sur leur profil
        et les partager avec d'autres enfants, qui peuvent leur envoyer des cœurs et des commentaires. En créant un compte ou en
        utilisant ChildGram, tu acceptes ces conditions.
      </p>

      <h2>1. Qui peut créer un compte ?</h2>
      <ul>
        <li>
          <strong>Moins de 13 ans :</strong> tout utilisateur de moins de 13 ans doit disposer d'une <strong>autorisation parentale formelle</strong>.
          Le compte doit être <strong>ouvert par un parent ou un représentant légal</strong>, qui le confirme lors de l'inscription.
        </li>
        <li>
          Le parent ou représentant légal reste responsable de l'utilisation de ChildGram par l'enfant et l'accompagne dans sa découverte de la plateforme.
        </li>
        <li>Chaque compte est personnel. On ne partage pas son mot de passe avec d'autres enfants.</li>
      </ul>

      <h2>2. Le compte</h2>
      <ul>
        <li>On s'inscrit avec un pseudo et un mot de passe. Aucune adresse e-mail n'est demandée.</li>
        <li>Le profil contient un pseudo, une date de naissance (gardée secrète), une bio facultative et un avatar choisi parmi 20 images proposées.</li>
        <li>Pour la sécurité des enfants, il n'est pas possible d'importer sa propre photo ni de mettre un lien vers une image en avatar.</li>
      </ul>

      <h2>3. Pas d'informations privées</h2>
      <p>
        ChildGram fait confiance à l'enfant et à ses parents pour <strong>ne jamais divulguer de données privées</strong>, ni sur lui-même, ni sur
        un autre enfant qu'il connaît. Cela veut dire : pas de vrai nom complet, pas d'adresse, pas de nom d'école, pas de numéro de
        téléphone, pas de photo, pas de réseau social, dans le pseudo, la bio, les titres, les dessins ou les commentaires.
      </p>

      <h2>4. Les règles de gentillesse</h2>
      <ul>
        <li>On publie uniquement ses propres dessins.</li>
        <li>On laisse des commentaires gentils et respectueux. Pas de moqueries, d'insultes ni de harcèlement.</li>
        <li>Pas de contenu violent, effrayant, choquant ou inapproprié pour des enfants.</li>
        <li>On ne donne jamais rendez-vous à quelqu'un rencontré sur ChildGram.</li>
      </ul>

      <h2>5. Tes dessins</h2>
      <p>
        Tes dessins t'appartiennent. En les publiant, tu autorises ChildGram à les afficher aux autres utilisateurs connectés de la plateforme.
        Tu peux à tout moment retirer un dessin de ton profil ou le supprimer depuis ton studio.
      </p>

      <h2>6. Modération</h2>
      <p>
        ChildGram peut retirer un dessin, un commentaire ou suspendre un compte qui ne respecte pas ces règles, notamment pour protéger
        les enfants. Le propriétaire d'un dessin peut supprimer les commentaires reçus sur ce dessin.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        ChildGram fait de son mieux pour offrir un espace sûr et disponible, mais ne peut pas garantir l'absence totale d'interruptions ou
        d'erreurs. Les parents ou représentants légaux restent responsables de l'encadrement de l'enfant.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        La façon dont nous traitons les données est expliquée dans notre{" "}
        <Link to="/confidentialite" className="text-primary underline">politique de confidentialité</Link>.
      </p>

      <h2>9. Changements</h2>
      <p>Ces conditions peuvent évoluer. En cas de changement important, nous l'indiquerons sur la plateforme.</p>
    </LegalLayout>
  );
}
