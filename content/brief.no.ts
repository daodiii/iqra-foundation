/**
 * The foundation's brief, verbatim.
 *
 * Every string here is copied out of the brief in
 * `docs/prompts/2026-09-15-fable-identitet-og-struktur.md` (the text between its two
 * horizontal rules, markdown emphasis stripped) by a script, not typed. It is the site's
 * prose: nothing on the site says anything in its own words except the functional
 * microcopy in `site.no.ts`. `brief.test.ts` reads the brief back out of that file and
 * asserts that every passage below still appears in it unchanged, so a later edit here —
 * an «improvement» to a sentence — fails `npm test` instead of shipping.
 *
 * Which passage is which, by the brief's own numbering: 2 the home page's headline,
 * paragraph and two buttons; 3 Visjon; 4 Misjon; 5 Om oss; 6 the four areas; 7 the board;
 * 8 the menu and the two page sentences; 9 the red thread; 1 the four areas in one line.
 */
export const brief = {
  /** 2. Hovedtekst på forsiden */
  home: {
    headline: "En stiftelse for kunnskap, dialog, møteplasser og samfunnsdeltakelse",
    paragraph: "Iqra Foundation er en selvstendig og allmennyttig stiftelse forankret i islamske verdier og prinsipper. Vi utvikler kunnskap, bygger møteplasser og fremmer dialog og aktiv samfunnsdeltakelse.",
    /** «Knapper»: on to Vårt arbeid, and to Støtt oss. */
    buttons: ["Utforsk vårt arbeid", "Støtt oss"],
  },
  /** 3. Visjon */
  vision: {
    headline: "Et samfunn der kunnskap og dialog skaper forståelse, deltakelse og sterkere fellesskap.",
    paragraph: "Vi ønsker å bidra til et samfunn der mennesker møtes, perspektiver utveksles og flere får mulighet til å lære, engasjere seg og delta.",
  },
  /** 4. Misjon */
  mission: {
    headline: "Iqra Foundation skal utvikle kunnskap, bygge møteplasser og legge til rette for dialog og aktiv samfunnsdeltakelse.",
    paragraph: "Med utgangspunkt i islamske verdier skaper vi arenaer for læring, refleksjon og meningsutveksling. Gjennom langsiktig arbeid og samarbeid ønsker vi å styrke forståelse, engasjement og deltakelse, særlig blant ungdom og voksne.",
  },
  /** 5. Om oss */
  about: {
    title: "Om Iqra Foundation",
    paragraphs: [
      "Iqra Foundation er en selvstendig, allmennyttig stiftelse forankret i islamske verdier og prinsipper.",
      "Vi arbeider i skjæringspunktet mellom kunnskap, dialog, møteplasser og samfunnsdeltakelse.",
      "Stiftelsen skal være en åpen og inkluderende arena for læring, refleksjon og meningsutveksling. Vi ønsker å bringe mennesker sammen, gjøre kunnskap tilgjengelig og skape rom for konstruktive samtaler om tro, samfunn og spørsmål som berører vår samtid.",
      "Gjennom kunnskapsformidling, møteplasser, arrangementer og samarbeid med relevante samfunnsaktører skal Iqra Foundation bidra til økt forståelse, sterkere fellesskap og aktiv samfunnsdeltakelse.",
    ],
  },
  /** 6. Fire hovedområder, in the brief's order. The keys are the routes' anchors. */
  areas: [
    { key: "kunnskap", name: "Kunnskap", text: "Vi skaper arenaer for læring, refleksjon og kunnskapsdeling. Gjennom faglige aktiviteter og ressurser ønsker vi å gjøre kunnskap tilgjengelig og bidra til en mer kunnskapsbasert samfunnssamtale." },
    { key: "dialog", name: "Dialog", text: "Vi legger til rette for åpne og konstruktive samtaler om tro, samfunn og aktuelle spørsmål. Vi ønsker å bringe ulike perspektiver sammen og bidra til større forståelse og tillit." },
    { key: "moteplasser", name: "Møteplasser", text: "Vi utvikler møteplasser der mennesker kan møtes, lære, utveksle perspektiver og bygge relasjoner. Ambisjonen er å utvikle både aktiviteter og varige arenaer for kunnskap, dialog og fellesskap." },
    { key: "samfunnsdeltakelse", name: "Samfunnsdeltakelse", text: "Vi ønsker å styrke særlig ungdom og voksnes muligheter til å engasjere seg og delta aktivt i samfunnet. Vi skal fremme ansvar, frivillighet, lederskap, fellesskap og demokratisk deltakelse." },
  ],
  /** 7. Menneskene bak Iqra: the title and the board paragraph. */
  people: {
    title: "Menneskene bak Iqra",
    paragraph: "Iqra Foundation forvaltes av et styre med ansvar for stiftelsens strategiske retning, økonomiske forvaltning og langsiktige utvikling. Bak stiftelsens arbeid står mennesker med ulik kompetanse og et felles engasjement for kunnskap, dialog og samfunnsdeltakelse.",
  },
  /** 8. Meny og undersider: the nine items in the brief's order, and the two page sentences. */
  menu: [
    "Hjem",
    "Om oss",
    "Vårt arbeid",
    "Arrangementer",
    "Ressurser",
    "Menneskene bak",
    "Styringsdokumenter",
    "Kontakt",
    "Støtt oss",
  ],
  documents: "Under Styringsdokumenter skal vi etter hvert kunne publisere vedtekter, årsrapporter, årsregnskap, strategier og andre sentrale dokumenter.",
  resources: "Under Ressurser skal vi kunne samle publikasjoner, artikler, rapporter, presentasjoner, videoer og annet kunnskapsinnhold.",
  /** 9. Iqra-identiteten: the red thread, two lines. */
  thread: {
    name: "IQRA FOUNDATION",
    line: "Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse.",
  },
  /** 1. Posisjonering: the four areas as one line. */
  four: "Kunnskap | Dialog | Møteplasser | Samfunnsdeltakelse",
} as const;

export type Brief = typeof brief;
