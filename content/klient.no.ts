/**
 * The client's new text for the site, 2026-11-18, word for word.
 *
 * Every string here is copied from `docs/prompts/2026-11-18-klient-oppdatering.md`: the
 * client's message (M) and their Word document «Iqra Foundation – nettsidetekst» (D). The one
 * exception is the plainer prose the owner picked on 2026-11-22 (option D, no «du»): each of
 * those rewrites is listed in REWRITES in `klient.test.ts`. Any other change to a string here
 * fails `npm test` instead of shipping.
 *
 * Where the document puts a heading and its text in one paragraph («Læring som utvikler
 * Kurs, foredrag …»), the two are split here into `title` and `text`; both halves are still
 * the client's words.
 *
 * `islamske` is lower case, as the client writes it.
 */
export const klient = {
  /** M1: the menu, and its two submenus. */
  menu: {
    home: 'Hjem',
    about: 'Om oss',
    aboutFoundation: 'Om Iqra Foundation',
    work: 'Vårt arbeid',
    people: 'Menneskene bak',
    news: 'Aktuelt',
    newsItems: 'Nyheter',
    events: 'Arrangementer',
    resources: 'Ressurser',
    contact: 'Kontakt',
    support: 'Støtt oss',
  },

  /** D1 and M2: the home page. */
  home: {
    headline: 'Kunnskap som inspirerer. Fellesskap som styrker.',
    paragraphs: [
      'Iqra Foundation er en allmennyttig stiftelse i Oslo, bygget på islamske verdier og prinsipper. Vi arbeider for kunnskap og dialog, og for at folk skal forstå hverandre og ta aktivt del i samfunnet. Vi retter oss særlig mot ungdom og voksne.',
      'På møteplassene våre kan folk lære, dele erfaringer og ta ansvar for egen utvikling og for samfunnet rundt seg.',
    ],
    buttons: { about: 'Les mer om oss', events: 'Se kommende arrangementer' },
    why: {
      title: 'Hvorfor vi finnes',
      paragraphs: [
        'Med kunnskap kan mennesker forstå sin egen situasjon, delta i samfunnet og påvirke det. Når folk med ulik bakgrunn møtes, lytter og samarbeider, vokser det fram tillit og fellesskap.',
        'Iqra Foundation ble opprettet for å gi dette et varig og uavhengig sted. Her skal læring og engasjement få tid til å vokse. Folk skal få verktøy til å bidra aktivt i det norske samfunnet.',
      ],
    },
    /** M2: replaces the four boxes Kunnskap, Samfunnsdeltakelse, Dialog and Møteplasser. */
    create: {
      title: 'Dette ønsker vi å skape',
      intro: 'Med aktiviteter, samarbeid og formidling vil Iqra Foundation bidra til et mer opplyst og inkluderende samfunn, der flere engasjerer seg.',
      areas: [
        { title: 'Læring og utvikling', text: 'Kurs, foredrag og undervisning gir folk mulighet til å lære og utvikle seg.' },
        { title: 'Engasjement og deltakelse', text: 'Vi oppmuntrer ungdom og voksne til å ta initiativ og engasjere seg i samfunnet rundt seg.' },
        { title: 'Samarbeid og fellesskap', text: 'Vi bygger relasjoner og lager steder der folk, organisasjoner og fagmiljøer kan møtes og jobbe sammen.' },
      ],
    },
    /** D1's own three-part section. Whether it stands beside M2's is the client's question Q1. */
    action: {
      title: 'Fra kunnskap til handling',
      items: [
        { title: 'Læring som utvikler', text: 'Kurs, foredrag og opplæring som gir faglig påfyll og personlig utvikling. Vi legger vekt på kvalitet og kritisk tenkning, og på at det skal være nyttig i hverdagen.' },
        { title: 'Engasjement som skaper endring', text: 'Vi oppmuntrer ungdom og voksne til å ta initiativ og lede. Vi vil også at flere skal bidra som frivillige, lokalt og nasjonalt.' },
        { title: 'Møteplasser som bygger broer', text: 'Vi lager steder for samtale og samarbeid, fysisk og på nett. Der kan enkeltpersoner, organisasjoner, fagmiljøer og offentlige institusjoner møtes.' },
      ],
    },
    news: {
      title: 'Aktuelt',
      intro: 'Nyheter, kommende arrangementer og siste aktiviteter fra Iqra Foundation.',
      all: 'Se alle nyheter',
    },
    together: {
      title: 'Sammen kan vi gjøre en forskjell',
      text: 'Varige endringer i samfunnet krever at mange gjør noe sammen. Vi vil gjerne samarbeide med organisasjoner, fagmiljøer, virksomheter og enkeltpersoner i Norge og internasjonalt som er opptatt av kunnskap og dialog.',
      buttons: { partner: 'Bli samarbeidspartner', support: 'Støtt arbeidet' },
    },
  },

  /** D2: Om Iqra Foundation. */
  about: {
    title: 'Om Iqra Foundation',
    intro: 'Iqra Foundation STI er en allmennyttig stiftelse med forretningskontor i Oslo. Den er privat og selveiende, og organisasjonsnummeret er 817 388 752. Stiftelsen er opprettet og drives etter lov om stiftelser, og Stiftelsestilsynet fører tilsyn med den.',
    name: {
      title: 'Navnet Iqra',
      text: 'Iqra er arabisk og betyr «les». Det var det første ordet som ble åpenbart i Koranen, en oppfordring til å søke kunnskap og forståelse. Navnet viser hva vi står for. Vi mener læring og opplysning er grunnlaget for at mennesker og samfunn utvikler seg.',
    },
    purpose: {
      title: 'Vårt formål',
      lead: 'Iqra Foundation har et allmennyttig formål basert på islamske verdier og prinsipper. Stiftelsen skal:',
      points: [
        'fremme kunnskap, dialog og gjensidig forståelse',
        'etablere og utvikle møteplasser for læring og fellesskap',
        'styrke deltakelse, fellesskap og samfunnsengasjement, særlig blant ungdom og voksne',
      ],
    },
    values: {
      title: 'Vårt verdigrunnlag',
      lead: 'Vårt arbeid bygger på islamske verdier og prinsipper. I praksis betyr det at vi legger vekt på:',
      points: [
        { name: 'Kunnskap', text: 'å søke, dele og anvende kunnskap med ydmykhet og kvalitet' },
        { name: 'Ansvar', text: 'overfor mennesker, samfunnet og de ressursene vi forvalter' },
        { name: 'Respekt', text: 'for hvert menneskes verdighet, uavhengig av bakgrunn og livssyn' },
        { name: 'Fellesskap', text: 'å bygge tillit og samarbeid på tvers av miljøer' },
      ],
      close: 'Verdiene står i stiftelsens vedtekter. De skal gjelde for alt stiftelsen gjør, også på lang sikt.',
    },
    audience: {
      title: 'Hvem vi er for',
      text: 'Vi retter oss mest mot ungdom og voksne. Arrangementene og tilbudene er åpne for alle som vil lære og bidra.',
    },
    independent: {
      title: 'En allmennyttig og uavhengig stiftelse',
      paragraphs: [
        'Iqra Foundation har ingen eiere og har ikke erverv til formål. All kapital, alle eiendeler og alle inntekter skal utelukkende brukes til å fremme stiftelsens formål.',
        'Stiftelsen kan drive inntektsbringende virksomhet når denne støtter formålet og bidrar til økonomisk bærekraft. Eventuelt overskudd går i sin helhet tilbake til formålet. Vedtektene slår fast at verken styremedlemmer, stiftere eller deres nærstående kan oppnå økonomiske fordeler av stiftelsens midler.',
      ],
    },
  },

  /** D3: Vårt arbeid. The intro says six areas and lists seven: the client's question Q2. */
  work: {
    title: 'Vårt arbeid',
    intro: 'Iqra Foundation gjør kunnskap og verdier om til konkrete tiltak. Arbeidet er delt inn i seks områder.',
    areas: [
      {
        title: 'Kurs, opplæring og kompetanseutvikling',
        text: 'Vi holder og støtter kurs og undervisning. Deltakerne skal lære noe nytt og bli flinkere til å tenke kritisk. Det skal gjøre det lettere å delta i arbeid, utdanning og samfunnsliv.',
        note: 'Eksempler på tema: samfunnskunnskap, demokrati og deltakelse, lederskap, organisasjonsarbeid og religions- og livssynskunnskap.',
      },
      { title: 'Seminarer, konferanser og panelsamtaler', text: 'Vi holder seminarer, foredrag og debatter om faglige spørsmål og saker i samfunnet. Fagfolk, praktikere og beslutningstakere blir invitert, og ulike syn skal komme fram.' },
      { title: 'Dialog og gjensidig forståelse', text: 'Vi tar initiativ til samtaler og samarbeid mellom mennesker og miljøer som sjelden møtes. Målet er at folk skal forstå og stole mer på hverandre, med færre fordommer.' },
      { title: 'Prosjekter, frivillighet og lederskap', text: 'Vi starter og støtter prosjekter der folk er frivillige og lærer å lede. Særlig ungdom og unge voksne skal få erfaring med å ta ansvar og engasjere seg der de bor.' },
      { title: 'Kunnskapsformidling og publikasjoner', text: 'Vi skriver og deler artikler, rapporter og digitale ressurser. Slik blir faglig kunnskap tilgjengelig for flere.' },
      { title: 'Møteplasser og læringsarenaer', text: 'Vi vil skape steder der folk kan lære og møtes, fysisk og på nett. På sikt ønsker vi egne lokaler, for eksempel et læringssenter, et aktivitetssenter og en konferansearena. Stiftelsen skal bruke dem selv, og andre med beslektede formål skal også kunne bruke dem.' },
      { title: 'Samarbeid og partnerskap', text: 'Vi samarbeider med organisasjoner, institusjoner og fagmiljøer i Norge og i utlandet når det hjelper stiftelsen å nå formålet. Samarbeidet bygger på felles mål, åpenhet og respekt.' },
    ],
  },

  /** D4 and M4: Menneskene bak. Only the five board members; no stiftelsesråd. */
  people: {
    title: 'Menneskene bak',
    intro: 'Iqra Foundation ledes av et styre, som er stiftelsens øverste organ. Medlemmene har erfaring fra samfunnsfag, organisasjonsliv, språk og formidling.',
    board: {
      title: 'Styret',
      text: 'Styret har ansvaret for stiftelsens strategi, økonomi og organisering, og for at formålet blir fulgt. Det representerer også stiftelsen utad. Styret har fem medlemmer, valgt for to år av gangen, og ett av dem har særlig ansvar for økonomi.',
    },
    /** In the document's order. Photos and short bios are not supplied yet (Q4). */
    members: [
      { name: 'Mohammed Isak Abdullahi', role: 'styreleder' },
      { name: 'Omar Abdirahman', role: 'styremedlem' },
      { name: 'Ali Mohamed Salah', role: 'styremedlem' },
      { name: 'Mohammed Abdi Dualeh', role: 'styremedlem' },
      { name: 'Liiban Abdullahi Abdibashir', role: 'styremedlem' },
    ],
    contact: {
      title: 'Kontakt styret',
      text: 'Henvendelser til styret kan sendes til post@iqrasti.no.',
    },
  },

  /** D5 and M3: Aktuelt. */
  news: {
    title: 'Aktuelt',
    intro: 'Nyheter, kunngjøringer og arrangementer fra Iqra Foundation.',
    filter: { all: 'Alle', news: 'Nyheter', events: 'Arrangementer' },
    newsText: 'Oppdateringer om stiftelsens arbeid, nye prosjekter, samarbeid og kunngjøringer.',
    eventsText: 'Kommende seminarer, foredrag og kurs, med tid, sted, program og påmelding. Arkivet viser tidligere arrangementer med referater og opptak der det er tilgjengelig.',
    /** The second sentence of `eventsText`, alone: the archive page's lede. */
    archiveText: 'Arkivet viser tidligere arrangementer med referater og opptak der det er tilgjengelig.',
    newsletter: { link: 'Nyhetsbrevet', text: 'sender invitasjoner og oppdateringer direkte på e-post.' },
  },

  /** D6 and M5: Ressurser. M5 has four categories; D6 gives texts for three (Q3). */
  resources: {
    title: 'Ressurser',
    intro: 'Kunnskap skal være lett å finne og lett å dele. I ressursbiblioteket samler vi materiale for læring og ettertanke.',
    categories: [
      { key: 'publikasjoner', title: 'Publikasjoner og rapporter', text: 'Faglige rapporter, notater og annet skriftlig materiale fra stiftelsens arbeid.' },
      { key: 'artikler', title: 'Artikler og fagstoff', text: 'Lengre tekster om dialog, samfunnsdeltakelse og fellesskap.' },
      { key: 'videoer', title: 'Videoer og presentasjoner', text: null },
      { key: 'styringsdokumenter', title: 'Styringsdokumenter', text: 'Stiftelsens vedtekter, årsregnskap, årsberetning og andre viktige dokumenter. De ligger her så alle kan se hvordan stiftelsen styres og hvordan pengene brukes.' },
    ],
  },

  /** D7: Støtt oss. The account or Vipps number after «Gave» is not in the document (Q6). */
  support: {
    title: 'Støtt Iqra Foundation',
    intro: 'Gaver og samarbeid er det som lar oss lage nye tilbud. Med flere gaver kan vi holde flere kurs, arrangementer og prosjekter. Vi kan også bygge møteplasser som mange får glede av i årene som kommer.',
    uses: {
      title: 'Hva bidraget går til',
      lead: 'Alle bidrag brukes utelukkende til stiftelsens allmennyttige formål, blant annet:',
      points: [
        'kurs, opplæring og kompetansehevende tiltak',
        'seminarer, konferanser og dialogarrangementer',
        'prosjekter for frivillighet og lederskap blant ungdom og voksne',
        'kunnskapsmateriell og digitale ressurser',
        'utvikling av møteplasser og læringsarenaer',
      ],
      close: 'Stiftelsen har ingen eiere, og overskudd kan aldri tilfalle privatpersoner. Regnskapet revideres og gjøres tilgjengelig.',
    },
    ways: {
      title: 'Måter å bidra på',
      items: [
        { title: 'Gave', text: 'Enkeltbeløp eller fast månedlig støtte.' },
        { title: 'Samarbeid og partnerskap', text: 'For organisasjoner, institusjoner og virksomheter som ønsker å støtte eller samarbeide om konkrete tiltak.' },
        { title: 'Frivillig innsats', text: 'Frivillige hjelper til med tid og kompetanse i arrangementer og prosjekter.' },
      ],
    },
    close: 'Sammen kan vi skape flere muligheter.',
  },

  /** D8: contact and footer. Facebook and Instagram handles are not supplied (Q10). */
  contact: {
    name: 'Iqra Foundation STI',
    orgnr: '817 388 752',
    postbox: 'Postboks 9044',
    postcode: '0133 Oslo',
    phone: '+47 941 43 585',
    email: 'post@iqrasti.no',
  },
} as const;

export type Klient = typeof klient;
