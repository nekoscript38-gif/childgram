import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout } from "@/components/childgram/LegalLayout";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — ChildGram" },
      { name: "description", content: "Quelles données ChildGram collecte, pourquoi, et comment elles sont protégées." },
      { property: "og:title", content: "Politique de confidentialité — ChildGram" },
      { property: "og:description", content: "Quelles données ChildGram collecte, pourquoi, et comment elles sont protégées." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="12 novembre 2026">
      <p>
        ChildGram est pensé pour les enfants : nous collectons le moins de données possible. Cette page explique, aux enfants comme
        aux parents, ce que nous gardons et pourquoi.
      </p>

      <h2>1. Les données que nous collectons</h2>
      <ul>
        <li><strong>Pseudo</strong> : visible par les autres utilisateurs connectés.</li>
        <li><strong>Mot de passe</strong> : stocké de façon chiffrée, personne ne peut le lire, pas même nous.</li>
        <li><strong>Date de naissance</strong> : sert uniquement à vérifier si une autorisation parentale est nécessaire. Elle n'est jamais affichée aux autres.</li>
        <li><strong>Autorisation parentale</strong> : pour les moins de 13 ans, nous enregistrons que le parent ou représentant légal a confirmé ouvrir le compte et donner son accord, ainsi que la date d'acceptation des conditions.</li>
        <li><strong>Bio et avatar</strong> : la bio facultative et l'avatar choisi parmi nos 20 images, visibles par les autres utilisateurs connectés.</li>
        <li><strong>Dessins, cœurs et commentaires</strong> : les brouillons ne sont visibles que par toi ; les dessins publiés, les cœurs et les commentaires sont visibles par les utilisateurs connectés.</li>
      </ul>
      <p>
        Nous ne demandons <strong>pas d'adresse e-mail, pas de photo, pas de numéro de téléphone et pas de localisation</strong>. Il n'est pas
        possible d'importer une image ou un lien en avatar.
      </p>

      <h2>2. Pourquoi nous les utilisons</h2>
      <ul>
        <li>Faire fonctionner ton compte, ton studio et ton profil.</li>
        <li>Afficher tes dessins publiés, les cœurs et les commentaires aux autres enfants.</li>
        <li>Vérifier l'autorisation parentale pour les moins de 13 ans.</li>
        <li>Protéger la communauté et faire respecter les <Link to="/conditions" className="text-primary underline">conditions d'utilisation</Link>.</li>
      </ul>
      <p>Nous ne vendons aucune donnée et n'affichons aucune publicité.</p>

      <h2>3. Qui peut voir quoi ?</h2>
      <p>
        Les profils et les dessins publiés ne sont visibles que par les personnes connectées à ChildGram. La date de naissance et les
        brouillons restent privés.
      </p>

      <h2>4. Où sont stockées les données</h2>
      <p>
        Les comptes, profils, dessins, cœurs et commentaires sont hébergés par Lovable Cloud, le service technique qui fait fonctionner
        ChildGram. Pour que tu restes connecté, une clé de session est gardée dans le stockage local de ton navigateur ; elle est
        effacée quand tu te déconnectes.
      </p>
      <p>
        Les polices d'écriture du site sont chargées depuis Google Fonts : à cette occasion, Google reçoit l'adresse IP et les
        informations techniques du navigateur.
      </p>

      <h2>5. Mesure d'audience</h2>
      <p>
        Lovable, notre hébergeur, compte les visites du site. Cette mesure n'utilise pas de cookies, ne stocke rien sur ton appareil,
        ne garde pas les adresses IP et ne permet pas de savoir qui tu es. Lovable collecte ces données pour nous.{" "}
        <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer" className="text-primary underline">
          La politique de confidentialité de Lovable
        </a>{" "}
        explique comment elle les traite.
      </p>
      <p>
        Sur ChildGram, elle enregistre : les pages visitées, le site d'où vient le visiteur, son pays, son navigateur, son système
        d'exploitation et son type d'appareil, le temps passé sur les pages, la vitesse de chargement, les erreurs, et les clics sur
        les boutons et liens. Ces informations sont enregistrées pour tous les visiteurs. Les données détaillées sont gardées 90 jours,
        et des résumés quotidiens pendant un an.
      </p>

      <h2>6. Combien de temps</h2>
      <p>
        Les données du compte sont gardées tant que le compte existe. Un dessin supprimé l'est définitivement, avec ses cœurs et ses
        commentaires.
      </p>

      <h2>7. Tes droits et ceux de tes parents</h2>
      <p>
        Tu peux modifier ta bio et ton avatar dans les réglages, et retirer ou supprimer tes dessins depuis ton studio. Les parents ou
        représentants légaux peuvent demander l'accès, la correction ou la suppression complète du compte et de ses données en nous
        écrivant à : <strong>[adresse de contact à compléter]</strong>.
      </p>

      <h2>8. Changements</h2>
      <p>Cette politique peut évoluer. En cas de changement important, nous l'indiquerons sur la plateforme.</p>
    </LegalLayout>
  );
}
