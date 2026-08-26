import type { LegalTexts } from "./types";

export const legalEn: LegalTexts = {
  privacy: {
    title: "Privacy policy",
    intro:
      "Crowns is a logic game. This page explains what data we handle, what for, and what you can do about it. Last updated: {date}.",
    sections: [
      {
        heading: "Who is responsible",
        body: [
          "The data controller is {company}, tax ID {taxId}, which operates the service published at {site}.",
          "For anything related to your data: {email}.",
        ],
      },
      {
        heading: "What data we handle",
        body: ["It depends on how you play."],
        list: [
          "Playing without an account: none. Games and preferences stay in your browser and never reach our servers.",
          "Creating an account: your email address. If you sign in with Google or GitHub, we receive from them your email and the public name attached to it.",
          "Profile: player name, display name (if you set one) and chosen language.",
          "Games: board size, time taken, hints used, number of moves, date and the board you solved.",
          "Technical data: our providers log IP addresses and connection data so the service works and to protect it from abuse.",
        ],
      },
      {
        heading: "Why, and on what legal basis",
        body: [
          "Account and profile data let you sign in, keep your history and appear in the rankings: that is the service you ask for when you register.",
          "Technical and security data is handled under our legitimate interest in keeping the service available and free of abuse.",
          "We run no advertising, build no commercial profiles and never sell or share your data with third parties.",
        ],
      },
      {
        heading: "What is publicly visible",
        body: [
          "The game has rankings and an activity feed. When you solve a puzzle we publish your player name, your display name if you set one, the time, the hints used, the date and the board you played.",
          "Your email address is never public and is never shown to other players. If you would rather not be recognised, pick a player name that does not identify you.",
        ],
      },
      {
        heading: "What we store in your browser",
        body: [
          "We use no tracking cookies and no analytics tools. In your browser's local storage we keep: your session, the language, the light or dark theme, your best times and, if you play without an account, your game history.",
          "You can clear it at any time from your browser settings.",
        ],
      },
      {
        heading: "Who helps us run the service",
        body: ["We work with providers that handle data on our behalf:"],
        list: [
          "Supabase: database and accounts. Data is hosted on servers in London (United Kingdom), a country covered by a European Commission adequacy decision.",
          "GitHub Pages: web hosting.",
          "Google or GitHub: only if you choose to sign in with them, and solely to verify your identity.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "For as long as your account exists. If you delete it, we remove your profile and your games. Technical logs are kept by our providers for the periods they apply for security reasons.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask us to access, correct, delete, restrict or object to the handling of your data, and to port it elsewhere. Write to {email} and we will reply within the legal deadline.",
          "If you believe your request was not handled properly, you may complain to the Spanish Data Protection Agency (aepd.es) or to your local supervisory authority.",
        ],
      },
      {
        heading: "Minors",
        body: [
          "The service is not aimed at children under 14. If we find an account belonging to a younger child without their guardian's consent, we will delete it.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "If this policy changes we will update the date above and, when the change matters, announce it in the game itself.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms of service",
    intro:
      "These terms govern the use of Crowns, available at {site}. By using the game you accept them. Last updated: {date}.",
    sections: [
      {
        heading: "What Crowns is",
        body: [
          "Crowns is a free logic game operated by {company} (tax ID {taxId}). You can play without an account; creating one lets you keep your history and take part in the rankings.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You need to provide a valid email address and you are responsible for keeping your credentials safe. Tell us at {email} if you suspect someone else is using your account.",
          "Choose a respectful player name. We may change or withdraw names that are offensive, or that impersonate another person or brand.",
        ],
      },
      {
        heading: "Acceptable use",
        body: ["When using the game you agree not to:"],
        list: [
          "Automate games with programs or scripts to fake times or ranking positions.",
          "Try to reach other accounts' data or work around the service's restrictions.",
          "Overload the service or extract data in bulk.",
          "Use your player name or display name to publish offensive, unlawful or promotional content.",
        ],
      },
      {
        heading: "Results and rankings",
        body: [
          "When you solve a puzzle, your result and player name are published in the activity feed and the leaderboards.",
          "We may remove results that are clearly false or obtained in breach of these terms, and suspend the accounts involved.",
        ],
      },
      {
        heading: "Availability",
        body: [
          "The service is provided as is and free of charge, with no guarantee of continuous availability. It may change, be interrupted or shut down. Keep a copy of anything you care about: we cannot guarantee recovery of your games.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "To the extent permitted by law, {company} is not liable for indirect damages arising from the use of, or inability to use, the game. None of the above limits the rights consumer law grants you.",
        ],
      },
      {
        heading: "Ownership",
        body: [
          "The name, design and content of the game belong to {company}. The source code is published on GitHub and is governed by the licence stated there.",
        ],
      },
      {
        heading: "Leaving",
        body: [
          "You can stop using the game whenever you want. To delete your account and your data, write to {email}.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by Spanish law. If you act as a consumer, you may bring proceedings before the courts of your place of residence.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms. The date above marks the latest version and relevant changes will be announced in the game.",
        ],
      },
    ],
  },
};
