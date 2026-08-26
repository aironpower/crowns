import type { LegalTexts } from "./types";

export const legalDe: LegalTexts = {
  privacy: {
    title: "Datenschutzerklärung",
    intro:
      "Crowns ist ein Logikspiel. Diese Seite erklärt, welche Daten wir verarbeiten, wozu, und was du damit tun kannst. Letzte Aktualisierung: {date}.",
    sections: [
      {
        heading: "Wer verantwortlich ist",
        body: [
          "Verantwortlich für die Verarbeitung ist {company}, Steuernummer {taxId}, Betreiberin des unter {site} veröffentlichten Dienstes.",
          "Für alles rund um deine Daten: {email}.",
        ],
      },
      {
        heading: "Welche Daten wir verarbeiten",
        body: ["Das hängt davon ab, wie du spielst."],
        list: [
          "Ohne Konto: keine. Partien und Einstellungen bleiben in deinem Browser und erreichen unsere Server nie.",
          "Mit Konto: deine E-Mail-Adresse. Wenn du dich mit Google oder GitHub anmeldest, erhalten wir von dort deine E-Mail-Adresse und den zugehörigen öffentlichen Namen.",
          "Profil: Spielername, Anzeigename (falls gesetzt) und gewählte Sprache.",
          "Partien: Feldgröße, benötigte Zeit, verwendete Tipps, Anzahl der Züge, Datum und das gelöste Feld.",
          "Technische Daten: Unsere Dienstleister protokollieren IP-Adresse und Verbindungsdaten, damit der Dienst funktioniert und vor Missbrauch geschützt ist.",
        ],
      },
      {
        heading: "Wozu und auf welcher Rechtsgrundlage",
        body: [
          "Konto- und Profildaten ermöglichen die Anmeldung, speichern deinen Verlauf und zeigen dich in den Ranglisten: Das ist die Erfüllung des Dienstes, den du mit der Registrierung anforderst.",
          "Technische und Sicherheitsdaten verarbeiten wir aufgrund unseres berechtigten Interesses, den Dienst verfügbar und frei von Missbrauch zu halten.",
          "Keine Werbung, kein kommerzielles Profiling, kein Verkauf und keine Weitergabe an Dritte.",
        ],
      },
      {
        heading: "Was öffentlich sichtbar ist",
        body: [
          "Das Spiel hat Ranglisten und einen Aktivitätsbereich. Wenn du ein Rätsel löst, veröffentlichen wir deinen Spielernamen, gegebenenfalls deinen Anzeigenamen, die Zeit, die verwendeten Tipps, das Datum und das gespielte Feld.",
          "Deine E-Mail-Adresse ist nie öffentlich und wird anderen Spielenden nicht gezeigt. Wenn du nicht erkannt werden möchtest, wähle einen Spielernamen, der dich nicht identifiziert.",
        ],
      },
      {
        heading: "Was wir in deinem Browser speichern",
        body: [
          "Wir verwenden keine Tracking-Cookies und keine Analysewerkzeuge. Im lokalen Speicher des Browsers liegen: deine Sitzung, die Sprache, das helle oder dunkle Thema, deine Bestzeiten und, falls du ohne Konto spielst, dein Partienverlauf.",
          "Du kannst das jederzeit in den Browsereinstellungen löschen.",
        ],
      },
      {
        heading: "Wer uns beim Betrieb hilft",
        body: ["Wir arbeiten mit Dienstleistern, die Daten in unserem Auftrag verarbeiten:"],
        list: [
          "Supabase: Datenbank und Kontoverwaltung. Die Daten liegen auf Servern in London (Vereinigtes Königreich), einem Land mit Angemessenheitsbeschluss der Europäischen Kommission.",
          "GitHub Pages: Hosting der Website.",
          "Google oder GitHub: nur wenn du dich dort anmeldest, und ausschließlich zur Prüfung deiner Identität.",
        ],
      },
      {
        heading: "Wie lange wir speichern",
        body: [
          "Solange dein Konto besteht. Löschst du es, entfernen wir dein Profil und deine Partien. Technische Protokolle bewahren unsere Dienstleister für die von ihnen aus Sicherheitsgründen angewandten Fristen auf.",
        ],
      },
      {
        heading: "Deine Rechte",
        body: [
          "Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit verlangen. Schreib an {email}, wir antworten innerhalb der gesetzlichen Frist.",
          "Wenn du meinst, dein Anliegen sei nicht angemessen behandelt worden, kannst du dich bei der Datenschutzaufsichtsbehörde deines Landes beschweren.",
        ],
      },
      {
        heading: "Minderjährige",
        body: [
          "Der Dienst richtet sich nicht an Kinder unter 16 Jahren. Entdecken wir ein Konto eines jüngeren Kindes ohne Einwilligung der Sorgeberechtigten, löschen wir es.",
        ],
      },
      {
        heading: "Änderungen",
        body: [
          "Ändert sich diese Erklärung, aktualisieren wir das Datum oben und kündigen wesentliche Änderungen im Spiel an.",
        ],
      },
    ],
  },

  terms: {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Bedingungen regeln die Nutzung von Crowns unter {site}. Mit der Nutzung des Spiels akzeptierst du sie. Letzte Aktualisierung: {date}.",
    sections: [
      {
        heading: "Was Crowns ist",
        body: [
          "Crowns ist ein kostenloses Logikspiel, betrieben von {company} (Steuernummer {taxId}). Spielen geht auch ohne Konto; mit Konto bleibt dein Verlauf erhalten und du erscheinst in den Ranglisten.",
        ],
      },
      {
        heading: "Dein Konto",
        body: [
          "Du brauchst eine gültige E-Mail-Adresse und bist dafür verantwortlich, deine Zugangsdaten sicher zu verwahren. Melde dich unter {email}, wenn du vermutest, dass jemand anderes sie benutzt.",
          "Wähle einen respektvollen Spielernamen. Beleidigende Namen oder solche, die andere Personen oder Marken vortäuschen, können wir ändern oder entfernen.",
        ],
      },
      {
        heading: "Zulässige Nutzung",
        body: ["Bei der Nutzung des Spiels verpflichtest du dich, Folgendes zu unterlassen:"],
        list: [
          "Partien mit Programmen oder Skripten automatisieren, um Zeiten oder Platzierungen zu fälschen.",
          "Auf Daten anderer Konten zugreifen oder Beschränkungen des Dienstes umgehen.",
          "Den Dienst überlasten oder Daten massenhaft auslesen.",
          "Spielername oder Anzeigename für beleidigende, rechtswidrige oder werbliche Inhalte nutzen.",
        ],
      },
      {
        heading: "Ergebnisse und Ranglisten",
        body: [
          "Löst du ein Rätsel, werden dein Ergebnis und dein Spielername in der Aktivität und in den Ranglisten veröffentlicht.",
          "Offensichtlich falsche oder unter Verstoß gegen diese Bedingungen erzielte Ergebnisse können wir entfernen und die betroffenen Konten sperren.",
        ],
      },
      {
        heading: "Verfügbarkeit",
        body: [
          "Der Dienst wird kostenlos und wie besehen bereitgestellt, ohne Garantie durchgehender Verfügbarkeit. Er kann sich ändern, unterbrochen oder eingestellt werden. Sichere, was dir wichtig ist: Eine Wiederherstellung der Partien können wir nicht garantieren.",
        ],
      },
      {
        heading: "Haftung",
        body: [
          "Soweit gesetzlich zulässig, haftet {company} nicht für mittelbare Schäden aus der Nutzung oder Nichtnutzbarkeit des Spiels. Verbraucherrechte bleiben davon unberührt.",
        ],
      },
      {
        heading: "Rechte am Spiel",
        body: [
          "Name, Gestaltung und Inhalt des Spiels gehören {company}. Der Quellcode ist auf GitHub veröffentlicht und unterliegt der dort angegebenen Lizenz.",
        ],
      },
      {
        heading: "Kündigung",
        body: [
          "Du kannst die Nutzung jederzeit beenden. Zum Löschen von Konto und Daten schreib an {email}.",
        ],
      },
      {
        heading: "Anwendbares Recht",
        body: [
          "Es gilt spanisches Recht. Handelst du als Verbraucher, kannst du die Gerichte deines Wohnsitzes anrufen.",
        ],
      },
      {
        heading: "Änderungen",
        body: [
          "Wir können diese Bedingungen aktualisieren. Das Datum oben nennt die aktuelle Fassung; wesentliche Änderungen kündigen wir im Spiel an.",
        ],
      },
    ],
  },
};
