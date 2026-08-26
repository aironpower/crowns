import type { LegalTexts } from "./types";

export const legalFr: LegalTexts = {
  addressLine: "Adresse : {address}.",

  privacy: {
    title: "Politique de confidentialité",
    intro:
      "Crowns est un jeu de logique. Cette page explique quelles données nous traitons, pourquoi, et ce que tu peux en faire. Dernière mise à jour : {date}.",
    sections: [
      {
        heading: "Qui est responsable",
        body: [
          "Le responsable du traitement est {company}, numéro d'identification fiscale {taxId}, qui exploite le service publié sur {site}.",
          "Pour toute question relative à tes données : {email}.",
        ],
      },
      {
        heading: "Quelles données nous traitons",
        body: ["Cela dépend de la façon dont tu joues."],
        list: [
          "Sans compte : aucune. Les parties et les préférences restent dans ton navigateur et n'atteignent jamais nos serveurs.",
          "Avec un compte : ton adresse e-mail. Si tu te connectes avec Google ou GitHub, nous recevons d'eux ton e-mail et le nom public associé.",
          "Profil : nom de joueur, nom affiché (si tu en mets un) et langue choisie.",
          "Parties : taille de la grille, temps, indices utilisés, nombre de coups, date et grille résolue.",
          "Données techniques : nos prestataires enregistrent l'adresse IP et des données de connexion pour que le service fonctionne et se protège des abus.",
        ],
      },
      {
        heading: "Pourquoi et sur quelle base légale",
        body: [
          "Les données de compte et de profil servent à te connecter, conserver ton historique et t'afficher dans les classements : c'est l'exécution du service que tu demandes en t'inscrivant.",
          "Les données techniques et de sécurité relèvent de notre intérêt légitime à garder le service disponible et exempt d'abus.",
          "Aucune publicité, aucun profilage commercial, aucune vente ni cession de données à des tiers.",
        ],
      },
      {
        heading: "Ce qui est public",
        body: [
          "Le jeu comporte des classements et un fil d'activité. Quand tu résous une grille, nous publions ton nom de joueur, ton nom affiché le cas échéant, le temps, les indices utilisés, la date et la grille jouée.",
          "Ton adresse e-mail n'est jamais publique ni montrée aux autres joueurs. Si tu préfères ne pas être reconnu, choisis un nom de joueur qui ne t'identifie pas.",
        ],
      },
      {
        heading: "Ce que nous stockons dans ton navigateur",
        body: [
          "Nous n'utilisons ni cookies de suivi ni outils d'analyse. Dans le stockage local du navigateur, nous gardons : ta session, la langue, le thème clair ou sombre, tes meilleurs temps et, si tu joues sans compte, ton historique de parties.",
          "Tu peux l'effacer à tout moment depuis les réglages de ton navigateur.",
        ],
      },
      {
        heading: "Qui nous aide à fournir le service",
        body: ["Nous travaillons avec des prestataires qui traitent des données pour notre compte :"],
        list: [
          "Supabase : base de données et gestion des comptes. Les données sont hébergées sur des serveurs à Londres (Royaume-Uni), pays couvert par une décision d'adéquation de la Commission européenne.",
          "GitHub Pages : hébergement du site.",
          "Google ou GitHub : uniquement si tu choisis de t'y connecter, et seulement pour vérifier ton identité.",
        ],
      },
      {
        heading: "Combien de temps",
        body: [
          "Tant que ton compte existe. Si tu le supprimes, nous effaçons ton profil et tes parties. Les journaux techniques sont conservés par nos prestataires pendant les durées qu'ils appliquent pour des raisons de sécurité.",
        ],
      },
      {
        heading: "Tes droits",
        body: [
          "Tu peux demander l'accès à tes données, leur rectification, leur effacement, la limitation ou l'opposition au traitement, ainsi que leur portabilité. Écris à {email} : nous répondrons dans le délai légal.",
          "Si tu estimes que ta demande a été mal traitée, tu peux saisir l'autorité de protection des données de ton pays (en France, la CNIL).",
        ],
      },
      {
        heading: "Mineurs",
        body: [
          "Le service ne s'adresse pas aux enfants de moins de 15 ans. Si nous détectons un compte d'un enfant plus jeune sans l'accord de son responsable légal, nous le supprimerons.",
        ],
      },
      {
        heading: "Modifications",
        body: [
          "Si cette politique change, nous mettrons à jour la date en tête de page et, si le changement est important, nous l'annoncerons dans le jeu.",
        ],
      },
    ],
  },

  terms: {
    title: "Conditions du service",
    intro:
      "Ces conditions régissent l'utilisation de Crowns, disponible sur {site}. En utilisant le jeu, tu les acceptes. Dernière mise à jour : {date}.",
    sections: [
      {
        heading: "Ce qu'est Crowns",
        body: [
          "Crowns est un jeu de logique gratuit exploité par {company} (identifiant fiscal {taxId}). On peut jouer sans compte ; en créer un permet de conserver son historique et de figurer dans les classements.",
        ],
      },
      {
        heading: "Ton compte",
        body: [
          "Tu dois fournir une adresse e-mail valide et tu es responsable de la sécurité de tes identifiants. Préviens-nous à {email} si tu soupçonnes que quelqu'un les utilise.",
          "Choisis un nom de joueur respectueux. Nous pouvons modifier ou retirer les noms offensants, ou ceux qui usurpent l'identité d'une personne ou d'une marque.",
        ],
      },
      {
        heading: "Usage acceptable",
        body: ["En utilisant le jeu, tu t'engages à ne pas :"],
        list: [
          "Automatiser des parties avec des programmes ou des scripts pour fausser les temps ou les classements.",
          "Tenter d'accéder aux données d'autres comptes ni contourner les restrictions du service.",
          "Surcharger le service ou en extraire des données en masse.",
          "Utiliser ton nom de joueur ou ton nom affiché pour publier du contenu offensant, illégal ou publicitaire.",
        ],
      },
      {
        heading: "Résultats et classements",
        body: [
          "Quand tu résous une grille, ton résultat et ton nom de joueur sont publiés dans l'activité et les classements.",
          "Nous pouvons retirer les résultats manifestement faux ou obtenus en violation de ces conditions, et suspendre les comptes concernés.",
        ],
      },
      {
        heading: "Disponibilité",
        body: [
          "Le service est fourni en l'état et gratuitement, sans garantie de disponibilité continue. Il peut évoluer, être interrompu ou fermer. Garde une copie de ce qui compte pour toi : nous ne garantissons pas la récupération des parties.",
        ],
      },
      {
        heading: "Responsabilité",
        body: [
          "Dans la limite permise par la loi, {company} n'est pas responsable des dommages indirects liés à l'utilisation ou à l'impossibilité d'utiliser le jeu. Rien de ce qui précède ne limite les droits que te reconnaît le droit de la consommation.",
        ],
      },
      {
        heading: "Propriété",
        body: [
          "Le nom, le design et le contenu du jeu appartiennent à {company}. Le code source est publié sur GitHub et régi par la licence qui y figure.",
        ],
      },
      {
        heading: "Résiliation",
        body: [
          "Tu peux cesser d'utiliser le jeu quand tu veux. Pour supprimer ton compte et tes données, écris à {email}.",
        ],
      },
      {
        heading: "Droit applicable",
        body: [
          "Ces conditions sont régies par le droit espagnol. Si tu agis en tant que consommateur, tu peux saisir les tribunaux de ton domicile.",
        ],
      },
      {
        heading: "Modifications",
        body: [
          "Nous pouvons mettre à jour ces conditions. La date en tête de page indique la dernière version et les changements importants seront annoncés dans le jeu.",
        ],
      },
    ],
  },
};
