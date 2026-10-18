import { site } from './site.no.ts';

/**
 * The two legal pages, in plain bokmål: personvern (the privacy notice) and vilkår (the terms of use).
 *
 * A DRAFT, written 2026-10-18 from what the site does today and nothing more — it says no more than is
 * true of the code: no cookies and no browser storage, no form that sends anything, one counting tool
 * without cookies, one host. It names no agreement, certification or retention period the foundation has
 * not told us about. The foundation (and, if it wishes, a lawyer) must read it before the site is
 * announced, and it must be changed the day any of those facts changes: a form that sends mail, a
 * second tool, a cookie. The organisation number and the address stand as the site's own placeholders
 * (`site.contact`), so the build reports them like every other bracketed value.
 */

type Section = { id: string; heading: string; paragraphs: readonly string[]; list?: readonly string[] };

type Legal = { title: string; description: string; lede: string; sections: readonly Section[]; updated: string };

const c = site.contact;
const who = `Iqra Foundation, organisasjonsnummer ${c.orgnr}, ${c.address.street}, ${c.address.postcode} ${site.place}. E-post: ${c.email}.`;

export const privacy: Legal = {
  title: 'Personvern',
  description: 'Hvilke opplysninger nettsiden til Iqra Foundation behandler, hvorfor, og hvilke rettigheter du har.',
  lede: 'Vi samler inn så lite som mulig. Her står det hva nettsiden gjør, og hva du kan be oss om.',
  updated: '18. oktober 2026',
  sections: [
    {
      id: 'ansvarlig',
      heading: 'Hvem er ansvarlig',
      paragraphs: [`Behandlingsansvarlig for opplysningene på denne nettsiden er ${who}`],
    },
    {
      id: 'besok',
      heading: 'Når du besøker nettsiden',
      paragraphs: [
        'Nettsiden ligger hos Vercel, som leverer sidene til nettleseren din. For å gjøre det, og for å beskytte siden mot misbruk, behandler leverandøren tekniske opplysninger om besøket, blant annet IP-adressen din, tidspunktet og hvilken side du ba om. Grunnlaget er vår berettigede interesse i å levere og sikre nettsiden (personvernforordningen artikkel 6 nr. 1 bokstav f).',
        'Vi har ikke innlogging, brukerkontoer eller skjemaer som sender opplysninger til oss.',
      ],
    },
    {
      id: 'statistikk',
      heading: 'Statistikk',
      paragraphs: [
        'Vi bruker Vercel Web Analytics til å telle besøk. Verktøyet bruker ikke informasjonskapsler og bygger ikke en profil av deg. Vi ser samlet statistikk: hvilke sider som leses, hvor besøkene kommer fra og hvilken type enhet og nettleser som brukes. Grunnlaget er vår berettigede interesse i å forstå hvordan nettsiden brukes (artikkel 6 nr. 1 bokstav f).',
      ],
    },
    {
      id: 'kapsler',
      heading: 'Informasjonskapsler',
      paragraphs: [
        'Nettsiden setter ingen informasjonskapsler og bruker ikke lagring i nettleseren til å følge deg. Derfor har vi heller ikke noe banner som ber om samtykke. Hvis det endrer seg, oppdaterer vi denne siden først.',
      ],
    },
    {
      id: 'epost',
      heading: 'Når du skriver til oss',
      paragraphs: [
        `Hvis du sender oss e-post (${c.email}), bruker vi det du skriver og avsenderadressen til å svare deg og følge opp henvendelsen. Vi lagrer den så lenge det trengs for det, og ikke lenger. Grunnlaget er vår berettigede interesse i å svare på henvendelser (artikkel 6 nr. 1 bokstav f).`,
      ],
    },
    {
      id: 'andre',
      heading: 'Andre nettsteder',
      paragraphs: [
        'Nettsiden lenker til tjenester vi ikke styrer. «Opprett AvtaleGiro» fører til Solidus, der avtalen opprettes og betalingsopplysningene dine oppgis. Der gjelder deres personvernerklæring, ikke denne. Det samme gjelder Vipps og banken din når du gir på den måten. Kartet på Kontakt-siden er et bilde som ligger på vår egen nettside; lenken til OpenStreetMap er bare en kildehenvisning.',
      ],
    },
    {
      id: 'deling',
      heading: 'Deling',
      paragraphs: ['Vi selger ikke opplysninger om deg og deler dem ikke med andre enn leverandørene som trengs for å drive nettsiden, eller når loven krever det.'],
    },
    {
      id: 'rettigheter',
      heading: 'Dine rettigheter',
      paragraphs: [`Du kan be oss om å få vite hvilke opplysninger vi har om deg, og om å få dem rettet eller slettet. Du kan også be om at behandlingen begrenses, og du kan protestere mot den. Skriv til ${c.email}. Du kan klage til Datatilsynet (datatilsynet.no) hvis du mener vi behandler opplysninger i strid med reglene.`],
    },
    {
      id: 'endringer',
      heading: 'Endringer',
      paragraphs: ['Vi oppdaterer denne siden når nettsiden endrer seg. Datoen nederst viser når den sist ble endret.'],
    },
  ],
};

export const terms: Legal = {
  title: 'Vilkår',
  description: 'Vilkår for bruk av nettsiden til Iqra Foundation: innhold, ansvar, gaver og lenker.',
  lede: 'Dette er vilkårene for å bruke nettsiden. De er korte, fordi nettsiden er det også.',
  updated: '18. oktober 2026',
  sections: [
    {
      id: 'nettsiden',
      heading: 'Om nettsiden',
      paragraphs: [`Nettsiden drives av ${who} Den forteller om stiftelsen og arbeidet vår. Ved å bruke den godtar du disse vilkårene.`],
    },
    {
      id: 'innhold',
      heading: 'Innhold og opphavsrett',
      paragraphs: [
        'Tekstene, bildene, logoen og utformingen tilhører Iqra Foundation eller brukes med tillatelse. Du kan lese, dele lenken og sitere med kilde. Du kan ikke kopiere, endre eller bruke innholdet kommersielt, eller bruke navnet og logoen som om de var dine, uten skriftlig samtykke fra oss.',
      ],
    },
    {
      id: 'ansvar',
      heading: 'Ansvar',
      paragraphs: [
        'Vi gjør vårt beste for at det som står her er riktig og oppdatert, men vi kan ikke love at det er uten feil. Arrangementer, tider og steder kan endres. Vi er ikke ansvarlige for tap som følger av at du har stolt på innholdet, så langt loven tillater det.',
      ],
    },
    {
      id: 'gaver',
      heading: 'Gaver',
      paragraphs: [
        'Du kan gi til Iqra Foundation ved overføring til kontoen, med Vipps eller med AvtaleGiro. Betalingen skjer hos banken din, hos Vipps eller hos Solidus, ikke på denne nettsiden, og deres vilkår gjelder for betalingen. Spør oss om du lurer på noe.',
      ],
    },
    {
      id: 'lenker',
      heading: 'Lenker',
      paragraphs: ['Lenker til andre nettsteder er til hjelp. Vi styrer ikke de nettstedene og svarer ikke for innholdet deres.'],
    },
    {
      id: 'lov',
      heading: 'Lov',
      paragraphs: ['Norsk lov gjelder for bruken av nettsiden.'],
    },
    {
      id: 'kontakt',
      heading: 'Kontakt',
      paragraphs: [`Spørsmål om vilkårene: ${c.email}.`],
    },
  ],
};
