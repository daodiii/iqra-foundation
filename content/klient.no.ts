/**
 * The client's new text for the site, 2026-11-18, word for word.
 *
 * Every string here is copied from `docs/prompts/2026-11-18-klient-oppdatering.md`: the
 * client's message (M) and their Word document «Iqra Foundation – nettsidetekst» (D). Nothing
 * is reworded, shortened or added. `klient.test.ts` reads that file and fails if a string
 * below is not in it, so an «improved» sentence fails `npm test` instead of shipping.
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
      'Iqra Foundation er en allmennyttig stiftelse i Oslo som arbeider for kunnskap, dialog, gjensidig forståelse og aktiv samfunnsdeltakelse. Arbeidet vårt bygger på islamske verdier og prinsipper, og retter seg særlig mot ungdom og voksne.',
      'Vi skaper møteplasser der mennesker kan lære, utveksle erfaringer og ta ansvar – for egen utvikling og for samfunnet rundt seg.',
    ],
    buttons: { about: 'Les mer om oss', events: 'Se kommende arrangementer' },
    why: {
      title: 'Hvorfor vi finnes',
      paragraphs: [
        'Kunnskap gir mennesker forutsetninger for å forstå sin egen situasjon, delta i samfunnet og påvirke det. Samtidig skapes tillit og fellesskap når mennesker med ulik bakgrunn møtes, lytter og samarbeider.',
        'Iqra Foundation er opprettet for å bygge en varig og uavhengig plattform for nettopp dette: et sted der læring, refleksjon og engasjement kan utvikles over tid, og der mennesker får verktøy til å bidra aktivt i det norske samfunnet.',
      ],
    },
    /** M2: replaces the four boxes Kunnskap, Samfunnsdeltakelse, Dialog and Møteplasser. */
    create: {
      title: 'Dette ønsker vi å skape',
      intro: 'Gjennom aktiviteter, samarbeid og kunnskapsformidling vil Iqra Foundation bidra til et mer opplyst, inkluderende og engasjert samfunn.',
      areas: [
        { title: 'Læring og utvikling', text: 'Vi skaper muligheter for læring og personlig utvikling gjennom kurs, foredrag og undervisning.' },
        { title: 'Engasjement og deltakelse', text: 'Vi inspirerer ungdom og voksne til å ta initiativ, engasjere seg og bidra til positiv samfunnsutvikling.' },
        { title: 'Samarbeid og fellesskap', text: 'Vi bygger relasjoner og arenaer hvor mennesker, organisasjoner og fagmiljøer kan møtes og samarbeide.' },
      ],
    },
    /** D1's own three-part section. Whether it stands beside M2's is the client's question Q1. */
    action: {
      title: 'Fra kunnskap til handling',
      items: [
        { title: 'Læring som utvikler', text: 'Kurs, foredrag og opplæring som styrker både faglig kompetanse og personlig utvikling. Vi vektlegger kvalitet, kritisk refleksjon og relevans for deltakernes hverdag.' },
        { title: 'Engasjement som skaper endring', text: 'Vi inspirerer ungdom og voksne til å ta initiativ, utvikle lederskap og bidra gjennom frivillighet og samfunnsansvar – lokalt og nasjonalt.' },
        { title: 'Møteplasser som bygger broer', text: 'Vi etablerer fysiske og digitale arenaer for dialog og samarbeid mellom enkeltpersoner, organisasjoner, fagmiljøer og offentlige institusjoner.' },
      ],
    },
    news: {
      title: 'Aktuelt',
      intro: 'Nyheter, kommende arrangementer og siste aktiviteter fra Iqra Foundation.',
      all: 'Se alle nyheter',
    },
    together: {
      title: 'Sammen kan vi gjøre en forskjell',
      text: 'Varig samfunnsutvikling skapes gjennom felles innsats. Vi ønsker samarbeid med organisasjoner, institusjoner, fagmiljøer, virksomheter og enkeltpersoner – nasjonalt og internasjonalt – som deler vårt engasjement for kunnskap, dialog og fellesskap.',
      buttons: { partner: 'Bli samarbeidspartner', support: 'Støtt arbeidet' },
    },
  },

  /** D2: Om Iqra Foundation. */
  about: {
    title: 'Om Iqra Foundation',
    intro: 'Iqra Foundation STI er en privat, selveiende og allmennyttig stiftelse med forretningskontor i Oslo (org.nr. 817 388 752). Stiftelsen er opprettet og drives i samsvar med lov om stiftelser og er underlagt tilsyn av Stiftelsestilsynet.',
    name: {
      title: 'Navnet Iqra',
      text: 'Iqra er arabisk og betyr «les». Ordet er det første som ble åpenbart i Koranen, og det uttrykker en grunnleggende oppfordring til å søke kunnskap og forståelse. Navnet sier hva vi står for: at læring og opplysning er selve fundamentet for menneskelig utvikling og et godt samfunn.',
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
      close: 'Verdigrunnlaget er forankret i stiftelsens vedtekter og skal ivaretas i all virksomhet, også på lang sikt.',
    },
    audience: {
      title: 'Hvem vi er for',
      text: 'Virksomheten retter seg primært mot ungdom og voksne. Våre arrangementer og tilbud er åpne for alle som ønsker å lære, delta og bidra.',
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
    intro: 'Iqra Foundation omsetter kunnskap, verdier og engasjement til konkrete tiltak. Arbeidet er organisert i seks innsatsområder.',
    areas: [
      {
        title: 'Kurs, opplæring og kompetanseutvikling',
        text: 'Vi gjennomfører og støtter undervisning, kurs og kompetansehevende tiltak. Tilbudene skal gi deltakerne faglig påfyll, styrke evnen til kritisk refleksjon og gjøre dem bedre rustet til å delta i arbeidsliv, utdanning og samfunnsliv.',
        note: 'Eksempler på tema: samfunnskunnskap, demokrati og deltakelse, lederskap, organisasjonsarbeid og religions- og livssynskunnskap.',
      },
      { title: 'Seminarer, konferanser og panelsamtaler', text: 'Vi arrangerer seminarer, foredrag, konferanser, debatter og panelsamtaler om faglige og samfunnsaktuelle spørsmål. Vi inviterer fagpersoner, praktikere og beslutningstakere, og legger vekt på at ulike perspektiver kommer til orde.' },
      { title: 'Dialog og gjensidig forståelse', text: 'Vi tar initiativ til samtaler og samarbeid mellom mennesker og miljøer som sjelden møtes. Målet er økt kulturforståelse, færre fordommer og sterkere tillit i samfunnet.' },
      { title: 'Prosjekter, frivillighet og lederskap', text: 'Vi initierer, støtter og gjennomfører prosjekter som fremmer deltakelse, frivillighet, lederskap og samfunnsansvar. Vi ønsker særlig å gi ungdom og unge voksne erfaring med å ta ansvar, lede prosesser og engasjere seg i lokalsamfunnet.' },
      { title: 'Kunnskapsformidling og publikasjoner', text: 'Vi produserer og formidler artikler, rapporter, digitale ressurser og annet opplysningsmateriell. Gjennom dette gjør vi faglig og samfunnsrelevant kunnskap tilgjengelig for et bredere publikum.' },
      { title: 'Møteplasser og læringsarenaer', text: 'Vi arbeider for å etablere fysiske og digitale arenaer for læring, dialog og fellesskap. På sikt er målet å utvikle egne lokaler, som læringssenter, aktivitetssenter og konferansearena, som kan tjene både stiftelsens virksomhet og andre aktører med beslektede formål.' },
      { title: 'Samarbeid og partnerskap', text: 'Vi samarbeider med nasjonale og internasjonale organisasjoner, institusjoner og fagmiljøer når det styrker gjennomføringen av stiftelsens formål. Samarbeid skjer på grunnlag av felles mål, åpenhet og gjensidig respekt.' },
    ],
  },

  /** D4 and M4: Menneskene bak. Only the five board members; no stiftelsesråd. */
  people: {
    title: 'Menneskene bak',
    intro: 'Iqra Foundation ledes av et styre med bred erfaring fra samfunnsfag, organisasjonsliv, språk og formidling. Styret er stiftelsens øverste organ.',
    board: {
      title: 'Styret',
      text: 'Styret har det overordnede ansvaret for stiftelsens strategi, økonomi, organisering og gjennomføring av formålet, og representerer stiftelsen utad. Styret består av fem medlemmer som velges for to år av gangen. Ett av medlemmene har særskilt ansvar for økonomi.',
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
    intro: 'Her finner du nyheter, kunngjøringer og arrangementer fra Iqra Foundation.',
    filter: { all: 'Alle', news: 'Nyheter', events: 'Arrangementer' },
    newsText: 'Oppdateringer om stiftelsens arbeid, nye prosjekter, samarbeid og kunngjøringer.',
    eventsText: 'Kommende seminarer, konferanser, foredrag og kurs, med informasjon om tid, sted, program og påmelding. Arkivet viser tidligere arrangementer med referater og opptak der det er tilgjengelig.',
    /** The second sentence of `eventsText`, alone: the archive page's lede. */
    archiveText: 'Arkivet viser tidligere arrangementer med referater og opptak der det er tilgjengelig.',
    newsletter: { link: 'Meld deg på nyhetsbrevet', text: 'for å få invitasjoner og oppdateringer direkte.' },
  },

  /** D6 and M5: Ressurser. M5 has four categories; D6 gives texts for three (Q3). */
  resources: {
    title: 'Ressurser',
    intro: 'Kunnskap skal være tilgjengelig og kunne deles. I ressursbiblioteket samler vi materiale som bidrar til læring, refleksjon og forståelse.',
    categories: [
      { key: 'publikasjoner', title: 'Publikasjoner og rapporter', text: 'Faglige rapporter, notater og annet skriftlig materiale fra stiftelsens arbeid.' },
      { key: 'artikler', title: 'Artikler og fagstoff', text: 'Fordypende innhold om kunnskap, dialog, samfunnsdeltakelse og fellesskap.' },
      { key: 'videoer', title: 'Videoer og presentasjoner', text: null },
      { key: 'styringsdokumenter', title: 'Styringsdokumenter', text: 'Stiftelsens vedtekter, årsregnskap, årsberetning og andre sentrale dokumenter. Vi publiserer disse for å sikre åpenhet om hvordan stiftelsen styres og hvordan midlene brukes.' },
    ],
  },

  /** D7: Støtt oss. The account or Vipps number after «Gave» is not in the document (Q6). */
  support: {
    title: 'Bidra til kunnskap, dialog og fellesskap',
    intro: 'Iqra Foundation er avhengig av gaver og samarbeid for å kunne utvikle nye tilbud. Med din støtte kan vi gjennomføre flere kurs, arrangementer og prosjekter – og bygge møteplasser som kommer mange til gode, i dag og for kommende generasjoner.',
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
      title: 'Slik kan du bidra',
      items: [
        { title: 'Gave', text: 'Enkeltbeløp eller fast månedlig støtte.' },
        { title: 'Samarbeid og partnerskap', text: 'For organisasjoner, institusjoner og virksomheter som ønsker å støtte eller samarbeide om konkrete tiltak.' },
        { title: 'Frivillig innsats', text: 'Bidra med tid, kompetanse og engasjement i arrangementer og prosjekter.' },
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
