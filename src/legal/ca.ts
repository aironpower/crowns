import type { LegalTexts } from "./types";

export const legalCa: LegalTexts = {
  addressLine: "Domicili: {address}.",

  privacy: {
    title: "Política de privacitat",
    intro:
      "Crowns és un joc de lògica. Aquesta pàgina explica quines dades tractem, per a què i què hi pots fer. Última actualització: {date}.",
    sections: [
      {
        heading: "Qui és el responsable",
        body: [
          "El responsable del tractament és {company}, amb NIF {taxId}, titular del servei publicat a {site}.",
          "Per a qualsevol qüestió relacionada amb les teves dades: {email}.",
        ],
      },
      {
        heading: "Quines dades tractem",
        body: ["Depèn de com hi juguis."],
        list: [
          "Si hi jugues sense compte: cap. Les partides i les preferències es queden al teu navegador i no arriben als nostres servidors.",
          "Si crees un compte: la teva adreça de correu electrònic. Si entres amb Google o GitHub, en rebem el correu i el nom públic associat.",
          "Perfil: nom de jugador, nom visible (si en poses) i idioma triat.",
          "Partides: mida del tauler, temps emprat, pistes utilitzades, nombre de jugades, data i el tauler resolt.",
          "Dades tècniques: els nostres proveïdors registren l'adreça IP i dades de connexió perquè el servei funcioni i per protegir-lo d'abusos.",
        ],
      },
      {
        heading: "Per a què i amb quina base legal",
        body: [
          "Les dades del compte i del perfil serveixen perquè puguis entrar, desar el teu historial i sortir als rànquings: és l'execució del servei que demanes en registrar-t'hi.",
          "Les dades tècniques i de seguretat es tracten per interès legítim a mantenir el servei disponible i lliure d'abusos.",
          "No fem publicitat, no elaborem perfils comercials i no venem ni cedim dades a tercers.",
        ],
      },
      {
        heading: "Què es veu públicament",
        body: [
          "El joc té rànquings i un mur d'activitat. En resoldre un puzle es publiquen el teu nom de jugador, el nom visible si n'has posat, el temps, les pistes, la data i el tauler jugat.",
          "La teva adreça de correu no és mai pública ni es mostra a altres jugadors. Si prefereixes no ser reconegut, tria un nom de jugador que no t'identifiqui.",
        ],
      },
      {
        heading: "Què desem al teu navegador",
        body: [
          "No fem servir galetes de seguiment ni eines d'analítica. A l'emmagatzematge local del navegador hi desem: la sessió iniciada, l'idioma, el tema clar o fosc, els teus millors temps i, si jugues sense compte, el teu historial de partides.",
          "Ho pots esborrar quan vulguis des de les opcions del navegador.",
        ],
      },
      {
        heading: "Qui ens ajuda a prestar el servei",
        body: ["Treballem amb proveïdors que tracten dades per compte nostre:"],
        list: [
          "Supabase: base de dades i sistema de comptes. Les dades s'allotgen en servidors de Londres (Regne Unit), país amb decisió d'adequació de la Comissió Europea.",
          "GitHub Pages: allotjament del web.",
          "Google o GitHub: només si tries entrar-hi amb ells, i únicament per verificar la teva identitat.",
        ],
      },
      {
        heading: "Quant de temps conservem les dades",
        body: [
          "Mentre mantinguis el compte obert. Si el esborres, eliminem el teu perfil i les teves partides. Els registres tècnics dels proveïdors es conserven durant els terminis que ells apliquen per seguretat.",
        ],
      },
      {
        heading: "Els teus drets",
        body: [
          "Pots demanar-nos accedir a les teves dades, rectificar-les, suprimir-les, limitar-ne o oposar-te al tractament i sol·licitar-ne la portabilitat. Escriu a {email} i et respondrem dins del termini legal.",
          "Si creus que no hem atès bé la teva sol·licitud, pots reclamar davant l'Agència Espanyola de Protecció de Dades (aepd.es) o davant l'autoritat de control del teu país.",
        ],
      },
      {
        heading: "Menors",
        body: [
          "El servei no s'adreça a menors de 14 anys. Si detectem un compte d'un menor d'aquesta edat sense autorització de qui en tingui la tutela, l'eliminarem.",
        ],
      },
      {
        heading: "Canvis",
        body: [
          "Si aquesta política canvia, actualitzarem la data de la capçalera i, si el canvi és rellevant, ho avisarem dins del joc.",
        ],
      },
    ],
  },

  terms: {
    title: "Condicions del servei",
    intro:
      "Aquestes condicions regulen l'ús de Crowns, disponible a {site}. En fer servir el joc les acceptes. Última actualització: {date}.",
    sections: [
      {
        heading: "Què és Crowns",
        body: [
          "Crowns és un joc de lògica gratuït operat per {company} (NIF {taxId}). S'hi pot jugar sense compte; crear-ne un serveix per desar l'historial i participar als rànquings.",
        ],
      },
      {
        heading: "El teu compte",
        body: [
          "Cal facilitar una adreça de correu vàlida i ets responsable de mantenir les teves credencials segures. Avisa'ns a {email} si sospites que algú altre les fa servir.",
          "Tria un nom de jugador respectuós. Podem canviar o retirar noms ofensius, o els que suplantin una altra persona o marca.",
        ],
      },
      {
        heading: "Ús acceptable",
        body: ["En fer servir el joc et compromets a no:"],
        list: [
          "Automatitzar partides amb programes o scripts per falsejar temps o posicions als rànquings.",
          "Intentar accedir a dades d'altres comptes ni saltar-te les restriccions del servei.",
          "Sobrecarregar el servei o extreure'n dades de forma massiva.",
          "Fer servir el nom de jugador o el nom visible per publicar contingut ofensiu, il·legal o publicitari.",
        ],
      },
      {
        heading: "Resultats i rànquings",
        body: [
          "En resoldre un puzle, el teu resultat i el teu nom de jugador es publiquen a l'activitat i a les classificacions.",
          "Podem retirar resultats manifestament falsos o obtinguts incomplint aquestes condicions, i suspendre els comptes implicats.",
        ],
      },
      {
        heading: "Disponibilitat",
        body: [
          "El servei s'ofereix tal com és i de manera gratuïta, sense garantia de disponibilitat contínua. Pot canviar, interrompre's o tancar. Fes còpia del que t'importi: no garantim la recuperació de partides.",
        ],
      },
      {
        heading: "Responsabilitat",
        body: [
          "En la mesura que ho permeti la llei, {company} no respon de danys indirectes derivats de l'ús o de la impossibilitat d'usar el joc. Res del que s'ha dit no limita els drets que et reconeix la normativa de consumidors.",
        ],
      },
      {
        heading: "Propietat",
        body: [
          "El nom, el disseny i el contingut del joc pertanyen a {company}. El codi font està publicat a GitHub i es regeix per la llicència que hi figuri.",
        ],
      },
      {
        heading: "Baixa",
        body: [
          "Pots deixar de fer servir el joc quan vulguis. Per eliminar el teu compte i les teves dades, escriu a {email}.",
        ],
      },
      {
        heading: "Llei aplicable",
        body: [
          "Aquestes condicions es regeixen per la legislació espanyola. Si actues com a consumidor, pots acudir als jutjats del teu domicili.",
        ],
      },
      {
        heading: "Canvis",
        body: [
          "Podem actualitzar aquestes condicions. La data de la capçalera indica l'última versió i els canvis rellevants s'avisaran dins del joc.",
        ],
      },
    ],
  },
};
