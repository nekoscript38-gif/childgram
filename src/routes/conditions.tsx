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
    <LegalLayout title="Conditions d'utilisation" updated="15 novembre 2026">
      <p>
        Bienvenue sur ChildGram ! ChildGram est une plateforme où les enfants peuvent dessiner, publier leurs dessins sur leur profil
        et les partager avec d'autres enfants, qui peuvent leur envoyer des cœurs et des commentaires. En créant un compte ou en
        utilisant ChildGram, tu acceptes ces conditions.
      </p>

      <h2>1. Qui peut créer un compte ?</h2>
      <ul>
        <li>
          <strong>À partir de 4 ans :</strong> ChildGram est fait pour les enfants de <strong>moyenne section de maternelle et plus</strong>,
          pas pour les tout-petits ni les bébés. Il n'est pas possible de créer un compte pour un enfant de moins de 4 ans.
        </li>
        <li>
          <strong>Moins de 13 ans :</strong> tout utilisateur de moins de 13 ans doit disposer d'une <strong>autorisation parentale formelle</strong>.
          Le compte doit être <strong>ouvert par un parent ou un représentant légal</strong>, qui le confirme lors de l'inscription.
        </li>
        <li>
          Le parent ou représentant légal reste responsable de l'utilisation de ChildGram par l'enfant et l'accompagne dans sa découverte de la plateforme.
        </li>
        <li>Chaque compte est personnel. On ne partage pas son mot de passe avec d'autres enfants.</li>
      </ul>

      <h2>2. Les étapes de la vie selon ChildGram</h2>
      <p>
        Pour protéger chacun, ChildGram classe ses utilisateurs selon leur âge. Ces étapes décident qui peut créer un compte et qui
        peut écrire des commentaires à qui. Les cœurs restent ouverts à tout le monde.
      </p>
      <ul>
        <li>
          <strong>Bébé (de 0 à 18 mois) :</strong> un bébé ne doit <strong>jamais</strong> être devant un écran, ni en contact direct avec un
          écran. Cela peut entraîner un retard de développement. Un bébé n'a pas sa place sur ChildGram.
        </li>
        <li>
          <strong>Pré-enfant (de 18 mois à l'anniversaire des 4 ans) :</strong> les écrans sont fortement déconseillés. La médecine
          déconseille tout type d'écran à cet âge, c'est pourquoi un pré-enfant n'a pas sa place sur ChildGram.
        </li>
        <li>
          <strong>Petit enfant (de 4 ans à l'anniversaire des 9 ans) :</strong> il peut utiliser un écran pour dessiner et être créatif,
          mais il est vulnérable et facile à manipuler. C'est pour cela que les commentaires sont bloqués pour les comptes de cet âge :
          ils ne peuvent ni en écrire ni en recevoir.
        </li>
        <li>
          <strong>Grand enfant (9 à 12 ans) et pré-ado (12 à 14 ans), de 9 ans à l'anniversaire des 14 ans :</strong> aux yeux de
          ChildGram, ils ont la même maturité et la même vulnérabilité. Ils peuvent donc communiquer entre eux, mais avec personne
          d'autre. Tout compte de pré-ado qui se montre violent envers un compte de grand enfant sera <strong>banni</strong>.
        </li>
        <li>
          <strong>Adolescent (de 14 ans à l'anniversaire des 18 ans) :</strong> assez mature pour parler librement avec les autres
          adolescents et avec les pré-adultes. Les contacts avec les grands enfants, les pré-ados et tous les plus jeunes sont bloqués,
          ainsi qu'avec les adultes de 21 ans et plus.
        </li>
        <li>
          <strong>Pré-adulte (de 18 ans à l'anniversaire des 21 ans) :</strong> adulte parce qu'il est majeur, et « pré » parce que son
          développement biologique et psychologique n'est pas encore terminé. Un pré-adulte peut communiquer avec les adolescents, les
          autres pré-adultes et les adultes.
        </li>
        <li>
          <strong>Adulte (21 ans et plus) :</strong> peut communiquer avec les pré-adultes et les autres adultes, mais jamais avec les
          adolescents ni avec les plus jeunes.
        </li>
      </ul>
      <p>
        Ces barrières sont techniques : ChildGram les applique automatiquement, et personne ne peut les contourner, pas même
        l'administratrice. L'âge pris en compte est l'âge actuel, calculé à partir de la date de naissance.
      </p>

      <h2>3. Le compte</h2>
      <ul>
        <li>On s'inscrit avec un pseudo et un mot de passe. Aucune adresse e-mail n'est demandée.</li>
        <li>Le profil contient un pseudo, une date de naissance (gardée secrète), une bio facultative et un avatar choisi parmi 20 images proposées.</li>
        <li>Pour la sécurité des enfants, il n'est pas possible d'importer sa propre photo ni de mettre un lien vers une image en avatar.</li>
      </ul>

      <h2>4. Pas d'informations privées</h2>
      <p>
        ChildGram fait confiance à l'enfant et à ses parents pour <strong>ne jamais divulguer de données privées</strong>, ni sur lui-même, ni sur
        un autre enfant qu'il connaît. Cela veut dire : pas de vrai nom complet, pas d'adresse, pas de nom d'école, pas de numéro de
        téléphone, pas de photo, pas de réseau social, dans le pseudo, la bio, les titres, les dessins ou les commentaires.
      </p>

      <h2>5. Les règles de gentillesse</h2>
      <ul>
        <li>On publie uniquement ses propres dessins.</li>
        <li>On laisse des commentaires gentils et respectueux. Pas de moqueries, d'insultes ni de harcèlement.</li>
        <li>Pas de contenu violent, effrayant, choquant ou inapproprié pour des enfants.</li>
        <li>On ne donne jamais rendez-vous à quelqu'un rencontré sur ChildGram.</li>
        <li>
          Les commentaires ne se font qu'entre étapes de la vie proches (voir la partie 2). Avant 9 ans, on ne peut ni écrire ni recevoir
          de commentaires, mais tout le monde peut envoyer des cœurs.
        </li>
      </ul>

      <h2>6. Tes dessins</h2>
      <p>
        Tes dessins t'appartiennent. En les publiant, tu autorises ChildGram à les afficher aux autres utilisateurs connectés de la plateforme.
        Tu peux à tout moment retirer un dessin de ton profil ou le supprimer depuis ton studio.
      </p>

      <h2>7. Modération</h2>
      <p>
        ChildGram peut retirer un dessin, un commentaire ou suspendre un compte qui ne respecte pas ces règles, notamment pour protéger
        les enfants. Le propriétaire d'un dessin peut supprimer les commentaires reçus sur ce dessin.
      </p>
      <p>
        <strong>Profil mis à 0 an :</strong> l'administratrice de ChildGram peut corriger l'âge d'un profil, et le descendre à{" "}
        <strong>0 an</strong> pour bloquer toute interaction (par exemple en cas de tricherie sur l'âge ou de faux profil). Un profil à 0 an
        est banni :
      </p>
      <ul>
        <li>il ne peut plus créer, modifier ni publier de dessins ;</li>
        <li>il ne peut plus modifier son profil (avatar, bio) ;</li>
        <li>il ne peut plus envoyer ni recevoir de cœurs ou de commentaires, et ses dessins ne sont plus montrés aux autres ;</li>
        <li>son profil affiche publiquement « Profil banni » avec une bannière rouge.</li>
      </ul>
      <p>
        Un profil à 0 an reste à 0 an, même après son anniversaire, jusqu'à ce que l'administratrice remonte son âge.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        ChildGram fait de son mieux pour offrir un espace sûr et disponible, mais ne peut pas garantir l'absence totale d'interruptions ou
        d'erreurs. Les parents ou représentants légaux restent responsables de l'encadrement de l'enfant.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        La façon dont nous traitons les données est expliquée dans notre{" "}
        <Link to="/confidentialite" className="text-primary underline">politique de confidentialité</Link>.
      </p>

      <h2>10. Changements</h2>
      <p>Ces conditions peuvent évoluer. En cas de changement important, nous l'indiquerons sur la plateforme.</p>
    </LegalLayout>
  );
}
